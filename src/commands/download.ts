import Portal from '../services/portal'; // why do I have to add the .js here?
import { Configuration, Product, Products, Tokens } from 'ordercloud-javascript-sdk';
import { SerializedMarketplace } from '../models/serialized-marketplace';
import OrderCloudBulk from '../services/ordercloud-bulk';
import { defaultLogger, LogCallBackFunc, MessageType } from '../services/logger';
import { BuildResourceDirectory } from '../models/oc-resource-directory';
import { OCResource } from '../models/oc-resources';
import _  from 'lodash';
import { MARKETPLACE_ID, REDACTED_MESSAGE } from '../constants';
import PortalAPI from '../services/portal';
import Bottleneck from 'bottleneck';
import { OCResourceEnum } from '../models/oc-resource-enum';

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
    var org_token: string;
    if (_.isNil(portalToken)) {
        if (_.isNil(username) || _.isNil(password)) {
            return logger(`Missing required arguments: username and password`, MessageType.Error)
        }
        try {
            portalToken = (await portal.login(username, password)).access_token;
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
        console.log(e);
        return logger(`Marketplace with ID \"${marketplaceID}\" not found`, MessageType.Error)
    }

    Tokens.SetAccessToken(org_token);

    logger(`Found your Marketplace \"${marketplaceID}\" . Beginning download.`, MessageType.Success);

    // Pull Data from Ordercloud
    var ordercloudBulk = new OrderCloudBulk(new Bottleneck({
        minTime: 100,
        maxConcurrent: 8
    }));
    var marketplace = new SerializedMarketplace();
    var directory = await BuildResourceDirectory(false); 
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
        // if (resource.name === OCResourceEnum.Products) {
        //     for (var product of records) {
        //         if (product.VariantCount > 0) {
        //             var variants = await ordercloudBulk.ListAllWithFunction("Variants" as any, Products.ListVariants, product.ID);
        //             product[VARIANTS_PROPERTY] = variants;
        //         }
        //     }
        // }
        marketplace.AddRecords(resource, records);
        for (let childResourceName of resource.children)
        {
            let childResource = directory.find(x => x.name === childResourceName);
            for (let parentRecord of records) {
                if (childResource.shouldAttemptListFunc(parentRecord)) {
                    var childRecords = await ordercloudBulk.ListAll(childResource, parentRecord.ID); // assume ID exists. Which is does for all parent types.
                    if (childResource.downloadTransformFunc !== undefined) {
                        childRecords = childRecords.map(childResource.downloadTransformFunc)
                    }
                    for (let childRecord of childRecords) {
                        childRecord[childResource.parentRefField] = parentRecord.ID;
                    }
                    marketplace.AddRecords(childResource, childRecords);
                }
            }
            if (childRecords && childRecords.length !== 0) {
                logger("Found " + childRecords.length + " " + childResourceName);
            }
        }
        if (records.length !== 0) {
            logger("Found " + records.length + " " + resource.name);
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
                if (record[resource.hasOwnerIDField] === marketplaceID) {
                    record[resource.hasOwnerIDField] = MARKETPLACE_ID;
                }
            }
        }
    }
} 