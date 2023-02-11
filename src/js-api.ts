import _ from "lodash";
import { ApiClient } from "ordercloud-javascript-sdk";
import { MARKETPLACE_ID_PLACEHOLDER, REDACTED_MESSAGE } from "./constants";
import { BuildOCResourceDirectory } from "./models/oc-resource-directory";
import { SeedRunContext } from "./models/seed-run-context";
import { ValidationRunContext } from "./models/validation-run-context";
import { Random, RefreshTimer } from "./services/util";
import { Seeder } from "./services/seeder";
import { Validator } from "./services/validator";
import OCPortalAPI from "./services/oc-portal-api";
import OrderCloudBulk from "./services/ordercloud-bulk";
import { OCResourceEnum } from "./models/oc-resource-enum";
import { OCResourceMetaData } from "./models/oc-resource-metadata";
import { JobMetaData } from "./models/job-metadata";
import { PortalAuthentication } from "@ordercloud/portal-javascript-sdk/dist/models/PortalAuthentication";
import { AllMarketplaceData } from "./models/all-marketplace-data";

export enum MessageType {
    Error,
    Info,
    Success,
    Warn,
    Progress,
    Done
}

export type LogCallBackFunc = (message: string, type?: MessageType, job?: JobMetaData) => void;

export interface DownloadArgs {
    username?: string; 
    password?: string; 
    marketplaceID: string; 
    portalAuth?: PortalAuthentication;
    logger?: LogCallBackFunc
}

export interface ValidateResponse {
    errors: string[];
    isValid: boolean;
    rawData: AllMarketplaceData
}

export interface ValidateArgs {
    rawData?: AllMarketplaceData;
    logger?: LogCallBackFunc
}

export interface SeedArgs {
    username?: string;
    password?: string; 
    marketplaceID?: string;
    marketplaceName?: string;
    portalAuth?: PortalAuthentication;
    rawData?: AllMarketplaceData;
    regionId?: string;
    logger?: LogCallBackFunc
}

export interface SeedResponse {
    marketplaceID: string;
    marketplaceName: string;
    accessToken: string;
    apiClients: ApiClient[];
}


// This is intended to be the only entry point for the public JS API
export class OCSeeding {

    static async validate(args: ValidateArgs): Promise<ValidateResponse> {
        var { 
            rawData,
            logger
        } = args;

        var directory = await BuildOCResourceDirectory();
        var context = new ValidationRunContext(directory, rawData, logger);
        Validator.validate(context);
        let errors = context.getErrors();
        let isValid = errors.length === 0
        if (isValid) {
            logger("Data validated and ready for seeding.", MessageType.Success);
        }
    
        return { errors, isValid, rawData: context.marketplaceData };
    }

    static async seed(args: SeedArgs): Promise<SeedResponse | void> {
        var { 
            username, 
            password, 
            marketplaceName,
            portalAuth,
            rawData,
            marketplaceID = Random.generateOrgID(), 
            regionId = "usw",
            logger
        } = args;

        // Run validation on the shape of the seed data
        var validateResponse = await this.validate({ rawData, logger});
        if (validateResponse?.errors?.length !== 0) return;
    
        // Authenticate To Portal
        var portal = new OCPortalAPI(marketplaceID, logger);
        let success = await portal.TryAuthIntoPortal(username, password, portalAuth);
        if (!success) return;
    
        success = await portal.TryCreateOrganization(marketplaceName, regionId);
        if (!success) return;
    
        success = await portal.TryAuthIntoMarketplace();
        if (!success) return;
        
        logger(`Seeding the newly created marketplace using api url \"${portal.marketplace.CoreApiUrl}\".`, MessageType.Success);
        
        // Upload to Ordercloud
        var directory = await BuildOCResourceDirectory();
        var context = new SeedRunContext(marketplaceID, directory, validateResponse.rawData, logger);
    
        await Seeder.seed(context);

        logger(`Done seeding.`, MessageType.Success);

        var results =  {
            marketplaceName,
            marketplaceID,
            accessToken: portal.auth.access_token,
            apiClients: context.getNewlyCreatedApiClientRecords()
        }
    
        return results;
    }
    
    static async download(args: DownloadArgs): Promise<AllMarketplaceData | void> {
        var { 
            username, 
            password, 
            marketplaceID, 
            portalAuth,
            logger
        } = args;
       
        if (!marketplaceID) {
            return logger(`Missing required argument: marketplaceID`, MessageType.Error);
        }
    
        // Authenticate To Portal
        let portal = new OCPortalAPI(marketplaceID, logger);
        let success = await portal.TryAuthIntoPortal(username, password, portalAuth);
        if (!success) return;

        success = await portal.TryAuthIntoMarketplace();
        if (!success) return;

        logger(`Found your Marketplace \"${marketplaceID}\". Beginning download.`, MessageType.Success);
    
        // Pull Data from Ordercloud
        var ordercloudBulk = new OrderCloudBulk(logger);
        var marketplace = new AllMarketplaceData();
        var directory = await BuildOCResourceDirectory();
        var childResourceRecordCounts = {}; 
        for (let resource of directory.listResourceMetadata()) {
            if (resource.isChild) {
                continue; // resource will be handled as part of its parent
            }
            var records = await ordercloudBulk.ListAll(resource);
            RedactSensitiveFields(resource, records);
            PlaceHoldMarketplaceID(resource, records);
            records = records.map(resource.downloadTransformFunc)
    
            logger(`Found ${records?.length || 0} ${resource.name}`);
            marketplace.AddRecords(resource, records);
            for (let childRef of resource.childrenReferences)
            {
                let childResource = childRef.;
                childResourceRecordCounts[childResource.name] = 0;
                childResourceRecordCounts[OCResourceEnum.VariantInventoryRecord] = 0;
                for (let parentRecord of records) {
                    if (childResource.shouldAttemptListFunc(parentRecord)) {
                        var childRecords = await ordercloudBulk.ListAll(childResource, parentRecord.ID); // assume ID exists. Which is does for all parent types.
                        childResourceRecordCounts[childResource.name] += childRecords.length;
                        PlaceHoldMarketplaceID(childResource, childRecords);
                        childRecords = childRecords.map(childResource.downloadTransformFunc)
                        for (let childRecord of childRecords) {
                            childRecord[childResource.parentReference.fieldNameOnThisResource] = parentRecord.ID;
                        }
                        marketplace.AddRecords(childResource, childRecords);
                        if (childResource.name === OCResourceEnum.Variant) {
                            var grandChildResource = directory.getResourceMetaData(OCResourceEnum.VariantInventoryRecord);
                            for (var variant of childRecords) {
                                var variantInventoryRecords = await ordercloudBulk.ListAll(grandChildResource, parentRecord.ID, variant.ID);
                                childResourceRecordCounts[OCResourceEnum.VariantInventoryRecord] += variantInventoryRecords.length;
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
                if (childResource.name === OCResourceEnum.Variant) {
                    logger(`Found ${childResourceRecordCounts[OCResourceEnum.VariantInventoryRecord]} ${OCResourceEnum.VariantInventoryRecord}`);
                }
            }
        }
        // Write to file
        logger(`Done downloading data from org \"${marketplaceID}\".`, MessageType.Success);
        return marketplace;
    
        function RedactSensitiveFields(resource: OCResourceMetaData, records: any[]): void {
            if (resource.redactedFields.length === 0) return;
    
            for (var record of records) {
                for (var field of resource.redactedFields) {
                    if (!_.isNil(record[field.field])) {
                        record[field.field] = REDACTED_MESSAGE;
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
    } 
}