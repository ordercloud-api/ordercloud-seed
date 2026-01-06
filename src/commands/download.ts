import Portal from '../services/portal'; // why do I have to add the .js here?
import { Configuration, InventoryRecords, Product, Products, Tokens } from 'ordercloud-javascript-sdk';
import { SerializedMarketplace } from '../models/serialized-marketplace';
import OrderCloudBulk from '../services/ordercloud-bulk';
import { defaultLogger, LogCallBackFunc, MessageType } from '../services/logger';
import { BuildResourceDirectory } from '../models/oc-resource-directory';
import { OCResource } from '../models/oc-resources';
import _  from 'lodash';
import { MARKETPLACE_ID as MARKETPLACE_ID_PLACEHOLDER, REDACTED_MESSAGE, TEN_MINUTES } from '../constants';
import PortalAPI from '../services/portal';
import Bottleneck from 'bottleneck';
import { OCResourceEnum } from '../models/oc-resource-enum';
import { RefreshTimer } from '../services/refresh-timer';
import { ConfigLoader } from '../services/config-loader';
import jwtDecode from 'jwt-decode';

export interface DownloadArgs {
    username?: string;
    password?: string;
    marketplaceID?: string;
    portalToken?: string;
    target?: string;
    configPath?: string;
    logger?: LogCallBackFunc
}

export async function download(args: DownloadArgs): Promise<SerializedMarketplace | void> {
    var {
        username,
        password,
        marketplaceID,
        portalToken,
        target,
        configPath,
        logger = defaultLogger
    } = args;
   
    // Authenticate
    var portal = new PortalAPI();
    var portalRefreshToken: string;
    var org_token: string;
    var userLoginAuthUsed = _.isNil(portalToken);
    var clientCredentialsUsed = !_.isNil(target);

    if (clientCredentialsUsed) {
        // Client Credentials Flow
        try {
            const config = ConfigLoader.load(target, configPath);
            logger(`Using client credentials from target "${target}"`, MessageType.Success);

            // Authenticate directly with OrderCloud API using client credentials
            const tokenResponse = await portal.loginWithClientCredentials(
                config.ApiClientId,
                config.ApiClientSecret,
                config.OrderCloudBaseUrl
            );
            org_token = tokenResponse.access_token;

            // Decode the JWT token to extract the marketplace ID
            const decodedToken: any = jwtDecode(org_token);
            const tokenMarketplaceID = decodedToken.cid;

            // Use marketplace ID from token if not provided
            if (_.isNil(marketplaceID)) {
                marketplaceID = tokenMarketplaceID;
                logger(`Using marketplace ID from token: ${marketplaceID}`, MessageType.Success);
            } else if (marketplaceID !== tokenMarketplaceID) {
                return logger(`Provided marketplace ID "${marketplaceID}" does not match the client credentials marketplace ID "${tokenMarketplaceID}"`, MessageType.Error);
            }

            Configuration.Set({ baseApiUrl: config.OrderCloudBaseUrl });
            Tokens.SetAccessToken(org_token);

            logger(`Authenticated with client credentials to ${config.OrderCloudBaseUrl}`, MessageType.Success);
        } catch (error) {
            return logger(`Client credentials authentication failed: ${error.message}`, MessageType.Error);
        }
    } else if (userLoginAuthUsed) {
        // Portal Login Flow
        if (_.isNil(username) || _.isNil(password)) {
            return logger(`Missing required arguments: username and password`, MessageType.Error)
        }
        try {
            var portalTokenData = await portal.login(username, password);
            portalToken = portalTokenData.access_token;
            portalRefreshToken = portalTokenData.refresh_token;
            RefreshTimer.set(refreshTokenFunc, TEN_MINUTES)
        } catch {
            return logger(`Username \"${username}\" and Password \"${password}\" were not valid`, MessageType.Error)
        }
    }

    if (!clientCredentialsUsed) {
        // Portal-based workflow: get organization token
        if (!marketplaceID) {
            return logger(`Missing required argument: marketplaceID`, MessageType.Error);
        }

        try {
            org_token = await portal.getOrganizationToken(marketplaceID, portalToken);

            var organization = await portal.GetOrganization(marketplaceID, portalToken);
            if(!organization)
            {
                return logger(`Couldn't get the marketplace with ID \"${marketplaceID}\".`, MessageType.Error);
            }

            Configuration.Set({ baseApiUrl: organization.CoreApiUrl });
        } catch (e) {
            return logger(`Marketplace with ID \"${marketplaceID}\" not found`, MessageType.Error)
        }

        Tokens.SetAccessToken(org_token);
    }

    logger(`Found your Marketplace \"${marketplaceID}\". Beginning download.`, MessageType.Success);

    // Pull Data from Ordercloud
    var ordercloudBulk = new OrderCloudBulk(new Bottleneck({
        minTime: 100,
        maxConcurrent: 8
    }), logger);
    var marketplace = new SerializedMarketplace();
    var directory = await BuildResourceDirectory();
    var childResourceRecordCounts = {}; 
    for (let resource of directory) {
        if (resource.isChild) {
            continue; // resource will be handled as part of its parent
        }
        var records = await ordercloudBulk.ListAll(resource);
        RedactSensitiveFields(resource, records);
        PlaceHoldMarketplaceID(resource, records);
        if (resource.downloadTransformFunc !== undefined) {
            records = records.map(resource.downloadTransformFunc)
        }
        logger(`Found ${records?.length || 0} ${resource.name}`);
        marketplace.AddRecords(resource, records);
        for (let childResourceName of resource.children)
        {
            let childResource = directory.find(x => x.name === childResourceName);
            childResourceRecordCounts[childResourceName] = 0;
            childResourceRecordCounts[OCResourceEnum.VariantInventoryRecords] = 0;
            for (let parentRecord of records) {
                if (childResource.shouldAttemptListFunc(parentRecord)) {
                    var childRecords = await ordercloudBulk.ListAll(childResource, parentRecord.ID); // assume ID exists. Which is does for all parent types.
                    childResourceRecordCounts[childResourceName] += childRecords.length;
                    PlaceHoldMarketplaceID(childResource, childRecords);
                    if (childResource.downloadTransformFunc !== undefined) {
                        childRecords = childRecords.map(childResource.downloadTransformFunc)
                    }
                    for (let childRecord of childRecords) {
                        childRecord[childResource.parentRefField] = parentRecord.ID;
                    }
                    marketplace.AddRecords(childResource, childRecords);
                    if (childResource.name === OCResourceEnum.Variants) {
                        var grandChildResource = directory.find(x => x.name === OCResourceEnum.VariantInventoryRecords);
                        for (var variant of childRecords) {
                            var variantInventoryRecords = await ordercloudBulk.ListAll(grandChildResource, parentRecord.ID, variant.ID);
                            childResourceRecordCounts[OCResourceEnum.VariantInventoryRecords] += variantInventoryRecords.length;
                            PlaceHoldMarketplaceID(grandChildResource, variantInventoryRecords);
                            for (let grandChildRecord of variantInventoryRecords) {
                                grandChildRecord["ProductID"] = parentRecord.ID;
                                grandChildRecord["VariantID"] = variant.ID;
                            }
                            marketplace.AddRecords(grandChildResource, variantInventoryRecords);
                        }                      
                    }   
                }
            } 
            logger(`Found ${childResourceRecordCounts[childResourceName]} ${childResourceName}`);
            if (childResource.name === OCResourceEnum.Variants) {
                logger(`Found ${childResourceRecordCounts[OCResourceEnum.VariantInventoryRecords]} ${OCResourceEnum.VariantInventoryRecords}`);
            }
        }
    }
    // Write to file
    logger(`Done downloading data from org \"${marketplaceID}\".`, MessageType.Success);
    return marketplace;

    function RedactSensitiveFields(resource: OCResource, records: any[]): void {
        if (resource.redactFields.length === 0) return;

        for (var record of records) {
            for (var field of resource.redactFields) {
                if (!_.isNil(record[field])) {
                    record[field] = REDACTED_MESSAGE;
                }
            }
        }
    }

    function PlaceHoldMarketplaceID(resource: OCResource, records: any[]): void {
        if (resource.hasOwnerIDField) {
            for (var record of records) {  
                // when Sandbox and Staging were created, marketplace IDs were appended with env to keep them unique
                var mktplID = marketplaceID.replace(/_Sandbox$/, "").replace(/_Staging$/, "");
                if (record[resource.hasOwnerIDField] === mktplID) {
                    record[resource.hasOwnerIDField] = MARKETPLACE_ID_PLACEHOLDER;
                }
            }
        }
    }

    async function refreshTokenFunc() {
        logger(`Refreshing the access token for Marketplace \"${marketplaceID}\". This should happen every 10 mins.`, MessageType.Warn)
  
        const portalTokenData = await portal.refreshToken(portalRefreshToken);
        portalToken = portalTokenData.access_token;
        portalRefreshToken = portalTokenData.refresh_token;

        org_token = await portal.getOrganizationToken(marketplaceID, portalToken);
        Tokens.SetAccessToken(org_token);
    }
} 