import Portal from '../services/portal';
import { Configuration, Specs, Tokens } from 'ordercloud-javascript-sdk';
import OrderCloudBulk from '../services/ordercloud-bulk';
import _ from 'lodash';
import { defaultLogger, LogCallBackFunc, MessageType } from '../services/logger';
import { validate } from './validate';
import { BuildResourceDirectory } from '../models/oc-resource-directory';
import { OCResourceEnum } from '../models/oc-resource-enum';
import { OCResource } from '../models/oc-resources';
import Random from '../services/random';
import { REDACTED_MESSAGE, ORDERCLOUD_URLS, MARKETPLACE_ID } from '../constants';
import RunThrottled from '../services/throttler';
import { SeedingAliasMap } from '../models/seeding-alias-map';
import PortalAPI from '../services/portal';
import { SerializedMarketplace } from '../models/serialized-marketplace';

export interface SeedArgs {
    username?: string;
    password?: string; 
    marketplaceID?: string;
    marketplaceName?: string;
    portalToken?: string,
    filePath?: string;
    rawData?: SerializedMarketplace;
    logger?: LogCallBackFunc
}

export async function seed(args: SeedArgs): Promise<void> {
    var { 
        username, 
        password, 
        marketplaceID, 
        marketplaceName,
        portalToken,
        rawData,
        filePath,
        logger = defaultLogger
    } = args;
    
    // Check for short-cut aliases
    if (!_.isNil(SeedingAliasMap[filePath])) {
        filePath = SeedingAliasMap[filePath];
    }
    // Run file validation
    var validateResponse = await validate({ rawData, filePath});
    if (validateResponse.errors.length !== 0) return;

    // Authenticate To Portal
    if (_.isNil(portalToken)) {
        if (_.isNil(username) || _.isNil(password)) {
            return logger(`Missing required arguments: username and password`, MessageType.Error)
        }
        var portal = new PortalAPI();
        try {
            portalToken = (await portal.login(username, password)).access_token;
        } catch {
            return logger(`Username \"${username}\" and Password \"${password}\" were not valid`, MessageType.Error)
        }
    }

    // Confirm orgID doesn't already exist
    marketplaceID = marketplaceID || Random.generateOrgID();
    try {
        await portal.GetOrganization(marketplaceID, portalToken);
        return logger(`A marketplace with ID \"${marketplaceID}\" already exists.`, MessageType.Error)
    } catch {}

    // Create Marketplace
    marketplaceName = marketplaceName || filePath.split("/").pop().split(".")[0];
    await portal.CreateOrganization(marketplaceID, marketplaceName, portalToken);
    logger(`Created new marketplace with Name \"${marketplaceName}\" and ID \"${marketplaceID}\".`, MessageType.Success); 

    // Authenticate to Core API
    var org_token = await portal.getOrganizationToken(marketplaceID, portalToken);
    Configuration.Set({ baseApiUrl: ORDERCLOUD_URLS.sandbox }); // always sandbox for upload
    Tokens.SetAccessToken(org_token);
    
    // Upload to Ordercloud
    var marketplace = new SerializedMarketplace(validateResponse.rawData);
    var apiClientIDMap = {};
    var specDefaultOptionIDList = [];
    var webhookSecret = Random.generateWebhookSecret(); // use one webhook secret for all webhooks, integration events and message senders
    var directory = await BuildResourceDirectory(false);
    for (let resource of directory.sort((a, b) => a.createPriority - b.createPriority)) {
        var records = marketplace.GetRecords(resource);
        SetOwnerID(resource, records);
        if (resource.name === OCResourceEnum.ApiClients) {
            await UploadApiClients(resource);
        } else if (resource.name === OCResourceEnum.ImpersonationConfigs) {
            await UploadImpersonationConfigs(resource);
        } else if (resource.name === OCResourceEnum.Specs) {
            await UploadSpecs(resource);
        } else if (resource.name === OCResourceEnum.SpecOptions) {
            await UploadSpecOptions(resource);
        } else if (resource.name === OCResourceEnum.Webhooks) {
            await UploadWebhooks(resource);
        } else if (resource.name === OCResourceEnum.OpenIdConnects) {
            await UploadOpenIdConnects(resource);
        } else if (resource.name === OCResourceEnum.ApiClientAssignments) {
            await UploadApiClientAssignments(resource);
        } else if (resource.name === OCResourceEnum.MessageSenders) {
            await UploadMessageSenders(resource);
        } else if (resource.name === OCResourceEnum.IntegrationEvents) {
            await UploadIntegrationEvents(resource);
        } else if (resource.name === OCResourceEnum.Categories) {
            await UploadCategories(resource);
        } else {
            await OrderCloudBulk.CreateAll(resource, records);
        }
        logger(`Uploaded ${records.length} ${resource.name}.`, MessageType.Progress); 
    }
    logger(`Done Seeding!`, MessageType.Success); 

    function SetOwnerID(resource: OCResource, records: any[]) {
        if (resource.hasOwnerIDField) {
            for (var record of records) {
                if (record.OwnerID === MARKETPLACE_ID) {
                    record.OwnerID = marketplaceID;
                }
            }
        }
    }

    // Need to remove and cache Spec.DefaultOptionID in order to PATCH it after the options are created.
    async function UploadSpecs(resource: OCResource): Promise<void> {
        records.forEach(r => {
            if (!_.isNil(r.DefaultOptionID)) { 
                specDefaultOptionIDList.push({ ID: r.ID, DefaultOptionID: r.DefaultOptionID}); // save for later step
                r.DefaultOptionID = null; // set null so create spec succeeds 
            }
        });
        await OrderCloudBulk.CreateAll(resource, records);
    }

    // Patch Spec.DefaultOptionID after the options are created.
    async function UploadSpecOptions(resource: OCResource): Promise<void> {
        await OrderCloudBulk.CreateAll(resource, records); 
        await RunThrottled(specDefaultOptionIDList, 8, x => Specs.Patch(x.ID, { DefaultOptionID: x.DefaultOptionID }));
    }

    async function UploadApiClients(resource: OCResource): Promise<void> {
        records.forEach(r => {
            if (r.ClientSecret === REDACTED_MESSAGE) { 
                r.ClientSecret = Random.generateClientSecret();
            }
        });
        var results = await OrderCloudBulk.CreateAll(resource, records);
        // Now that we have created the APIClients, we actually know what their IDs are.  
        for (var i = 0; i < records.length; i++) {
            apiClientIDMap[records[i].ID] = results[i].ID;
        }
    }

    async function UploadImpersonationConfigs(resource: OCResource): Promise<void> {
        records.forEach(r => r.ClientID = apiClientIDMap[r.ClientID]);
        await OrderCloudBulk.CreateAll(resource, records);
    }

    async function UploadOpenIdConnects(resource: OCResource): Promise<void> {
        records.forEach(r => r.OrderCloudApiClientID = apiClientIDMap[r.OrderCloudApiClientID]);
        await OrderCloudBulk.CreateAll(resource, records);
    }

    async function UploadCategories(resource: OCResource): Promise<void> {
        let depthCohort = records.filter(r => r.ParentID === null); // start with top-level
        while (depthCohort.length > 0) {
            // create in groups based on depth in the tree
            var results = await OrderCloudBulk.CreateAll(resource, depthCohort);
            // get children of those just created
            depthCohort = records.filter(r => results.some(result => r.ParentID === result.ID));
        }
    }

    async function UploadMessageSenders(resource: OCResource): Promise<void> {
        records.forEach(r => {
            if (r.SharedKey === REDACTED_MESSAGE) {
                r.SharedKey = webhookSecret;
            }
        });
        await OrderCloudBulk.CreateAll(resource, records);
    }

    async function UploadIntegrationEvents(resource: OCResource): Promise<void> {
        records.forEach(r => {
            if (r.HashKey === REDACTED_MESSAGE) {
                r.HashKey = webhookSecret;
            }
        });
        await OrderCloudBulk.CreateAll(resource, records);
    }

    async function UploadWebhooks(resource: OCResource): Promise<void> {
        records.forEach(r => {
            r.ApiClientIDs = r.ApiClientIDs.map(id => apiClientIDMap[id])
            if (r.HashKey === REDACTED_MESSAGE) {
                r.HashKey = webhookSecret;
            }
        });
        await OrderCloudBulk.CreateAll(resource, records);
    }

    async function UploadApiClientAssignments(resource: OCResource): Promise<void> {
        records.forEach(r => r.ApiClientID = apiClientIDMap[r.ApiClientID]);
        await OrderCloudBulk.CreateAll(resource, records);
    }
} 