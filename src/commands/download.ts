import Portal from '../services/portal'; // why do I have to add the .js here?
import { Configuration, InventoryRecords, Product, Products, Tokens } from 'ordercloud-javascript-sdk';
import { SerializedMarketplace } from '../models/serialized-marketplace';
import OrderCloudBulk from '../services/ordercloud-bulk';
import { defaultLogger, LogCallBackFunc, MessageType } from '../services/logger';
import { BuildOCResourceDirectory } from '../models/oc-resource-directory';
import _  from 'lodash';
import { MARKETPLACE_ID_PLACEHOLDER as MARKETPLACE_ID_PLACEHOLDER, REDACTED_MESSAGE, TEN_MINUTES } from '../constants';
import PortalAPI from '../services/portal';
import Bottleneck from 'bottleneck';
import { OCResourceEnum } from '../models/oc-resource-enum';
import { RefreshTimer } from '../services/refresh-timer';
import { OCResourceMetaData } from '../models/oc-resources';

export interface DownloadArgs {
    username?: string; 
    password?: string; 
    marketplaceID: string; 
    portalToken?: string;
    logger?: LogCallBackFunc
}

export async function download(args: DownloadArgs): Promise<SerializedMarketplace | void> {
    var { 
        username, 
        password, 
        marketplaceID, 
        portalToken,
        logger = defaultLogger
    } = args;
   
    if (!marketplaceID) {
        return logger(`Missing required argument: marketplaceID`, MessageType.Error);
    }

    // Authenticate
    var portal = new PortalAPI();
    var portalRefreshToken: string;
    var org_token: string;
    var userLoginAuthUsed = _.isNil(portalToken);
    if (userLoginAuthUsed) {
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

    logger(`Found your Marketplace \"${marketplaceID}\". Beginning download.`, MessageType.Success);

    // Pull Data from Ordercloud
    var ordercloudBulk = new OrderCloudBulk(new Bottleneck({
        minTime: 100,
        maxConcurrent: 8
    }), logger);
    var marketplace = new SerializedMarketplace();
    var directory = await BuildOCResourceDirectory();
    var childResourceRecordCounts = {}; 
    for (let resource of directory.listResourceMetadata()) {
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
        for (let childResource of resource.children)
        {
            childResourceRecordCounts[childResource.name] = 0;
            childResourceRecordCounts[OCResourceEnum.VariantInventoryRecords] = 0;
            for (let parentRecord of records) {
                if (childResource.shouldAttemptListFunc(parentRecord)) {
                    var childRecords = await ordercloudBulk.ListAll(childResource, parentRecord.ID); // assume ID exists. Which is does for all parent types.
                    childResourceRecordCounts[childResource.name] += childRecords.length;
                    PlaceHoldMarketplaceID(childResource, childRecords);
                    if (childResource.downloadTransformFunc !== undefined) {
                        childRecords = childRecords.map(childResource.downloadTransformFunc)
                    }
                    for (let childRecord of childRecords) {
                        childRecord[childResource.parentRefField] = parentRecord.ID;
                    }
                    marketplace.AddRecords(childResource, childRecords);
                    if (childResource.name === OCResourceEnum.Variants) {
                        var grandChildResource = directory.getResourceMetaData(OCResourceEnum.VariantInventoryRecords);
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
            logger(`Found ${childResourceRecordCounts[childResource.name]} ${childResource.name}`);
            if (childResource.name === OCResourceEnum.Variants) {
                logger(`Found ${childResourceRecordCounts[OCResourceEnum.VariantInventoryRecords]} ${OCResourceEnum.VariantInventoryRecords}`);
            }
        }
    }
    // Write to file
    logger(`Done downloading data from org \"${marketplaceID}\".`, MessageType.Success);
    return marketplace;

    function RedactSensitiveFields(resource: OCResourceMetaData, records: any[]): void {
        if (resource.redactFields.length === 0) return;

        for (var record of records) {
            for (var field of resource.redactFields) {
                if (!_.isNil(record[field])) {
                    record[field] = REDACTED_MESSAGE;
                }
            }
        }
    }

    function PlaceHoldMarketplaceID(resource: OCResourceMetaData, records: any[]): void {
        if (resource.hasSellerOwnerField) {
            for (var record of records) {  
                // when Sandbox and Staging were created, marketplace IDs were appended with env to keep them unique
                var mktplID = marketplaceID.replace(/_Sandbox$/, "").replace(/_Staging$/, "");
                if (record[resource.sellerOwnerReference.fieldNameOnThisResource] === mktplID) {
                    record[resource.sellerOwnerReference.fieldNameOnThisResource] = MARKETPLACE_ID_PLACEHOLDER;
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