import * as SeedingTemplates from '../../seeds/meta.json';
import { Configuration, Product, Products, Specs, Tokens, Variant } from 'ordercloud-javascript-sdk';
import OrderCloudBulk from '../services/ordercloud-bulk';
import _ from 'lodash';
import { defaultLogger, LogCallBackFunc, MessageType } from '../services/logger';
import { validate } from './validate';
import { BuildResourceDirectory } from '../models/oc-resource-directory';
import { OCResourceEnum } from '../models/oc-resource-enum';
import { OCResource } from '../models/oc-resources';
import Random from '../services/random';
import { REDACTED_MESSAGE, ORDERCLOUD_URLS, MARKETPLACE_ID, VARIANTS_PROPERTY } from '../constants';
import PortalAPI from '../services/portal';
import { SerializedMarketplace } from '../models/serialized-marketplace';
import { ApiClient, Organization } from '@ordercloud/portal-javascript-sdk';
import Bottleneck from 'bottleneck';

export interface SeedArgs {
    username?: string;
    password?: string; 
    marketplaceID?: string;
    marketplaceName?: string;
    portalToken?: string,
    dataUrl?: string;
    rawData?: SerializedMarketplace;
    logger?: LogCallBackFunc
}

export interface SeedResponse {
    marketplaceID: string;
    marketplaceName: string;
    accessToken: string;
    apiClients: ApiClient[];
}

export async function seed(args: SeedArgs): Promise<SeedResponse | void> {
    var { 
        username, 
        password, 
        marketplaceID, 
        marketplaceName,
        portalToken,
        rawData,
        dataUrl,
        logger = defaultLogger
    } = args;

    var template = SeedingTemplates.templates.find(x => x.name === dataUrl);
    if (!_.isNil(template)) {
        dataUrl = template.dataUrl;
    }
    
    // Run file validation
    var validateResponse = await validate({ rawData, dataUrl});
    if (validateResponse?.errors?.length !== 0) return;

    // Authenticate To Portal
    var portal = new PortalAPI();
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

    // Confirm orgID doesn't already exist
    marketplaceID = marketplaceID || Random.generateOrgID();
    try {
        await portal.GetOrganization(marketplaceID, portalToken);
        return logger(`A marketplace with ID \"${marketplaceID}\" already exists.`, MessageType.Error)
    } catch {}

    // Create Marketplace
    marketplaceName = marketplaceName || dataUrl?.split("/")?.pop()?.split(".")[0] || marketplaceID;
    await portal.CreateOrganization(marketplaceID, marketplaceName, portalToken);
    logger(`Created new marketplace with Name \"${marketplaceName}\" and ID \"${marketplaceID}\".`, MessageType.Success); 

    // Authenticate to Core API
    var org_token = await portal.getOrganizationToken(marketplaceID, portalToken);
    Configuration.Set({ baseApiUrl: ORDERCLOUD_URLS.sandbox }); // always sandbox for upload
    Tokens.SetAccessToken(org_token);
    
    // Upload to Ordercloud
    var marketplaceData = new SerializedMarketplace(validateResponse.rawData);
    var ordercloudBulk = new OrderCloudBulk(new Bottleneck({
        minTime: 100,
        maxConcurrent: 6
    }));
    var apiClientIDMap = {};
    var specDefaultOptionIDList = [];
    var webhookSecret = Random.generateWebhookSecret(); // use one webhook secret for all webhooks, integration events and message senders
    var directory = await BuildResourceDirectory(false);
    for (let resource of directory.sort((a, b) => a.createPriority - b.createPriority)) {
        var records = marketplaceData.GetRecords(resource);
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
            await ordercloudBulk.CreateAll(resource, records);
        }
        if (records.length != 0) {
            logger(`Created ${records.length} ${resource.name}.`, MessageType.Progress);
        }   
    }

    await GenerateAndPatchVariants();

    logger(`Done! Seeded a new marketplace with ID \"${marketplaceID}\" and Name \"${marketplaceName}\".`, MessageType.Success); 

    var apiClients = marketplaceData.Objects[OCResourceEnum.ApiClients].map(apiClient => {
        apiClient.ID = apiClientIDMap[apiClient.ID];
        return apiClient;
    })

    var results =  {
        marketplaceName,
        marketplaceID,
        accessToken: org_token,
        apiClients
    }

    return results;

    function SetOwnerID(resource: OCResource, records: any[]) {
        if (resource.hasOwnerIDField) {
            for (var record of records) {
                if (record.OwnerID === MARKETPLACE_ID) {
                    record.OwnerID = marketplaceID;
                }
            }
        }
    }

    async function GenerateAndPatchVariants() : Promise<void> {
        var productsWithVariants = marketplaceData.Objects[OCResourceEnum.Products].filter((p: Product) => p.VariantCount > 0);
        ordercloudBulk.Run("Variants" as any, productsWithVariants, (p: Product) => Products.GenerateVariants(p.ID));
        for (var product of productsWithVariants) {
            await ordercloudBulk.Run("Variants" as any, product[VARIANTS_PROPERTY], (v: Variant) => {
                var variantID = v.Specs.reduce((acc, spec) => `${acc}-${spec.OptionID}`, product.ID);
                return Products.SaveVariant(product.ID, variantID, v);
            });
        }
        logger(`Generated variants for ${productsWithVariants.length} products.`, MessageType.Progress);
    }

    // Need to remove and cache Spec.DefaultOptionID in order to PATCH it after the options are created.
    async function UploadSpecs(resource: OCResource): Promise<void> {
        records.forEach(r => {
            if (!_.isNil(r.DefaultOptionID)) { 
                specDefaultOptionIDList.push({ ID: r.ID, DefaultOptionID: r.DefaultOptionID}); // save for later step
                r.DefaultOptionID = null; // set null so create spec succeeds 
            }
        });
        await ordercloudBulk.CreateAll(resource, records);
    }

    // Patch Spec.DefaultOptionID after the options are created.
    async function UploadSpecOptions(resource: OCResource): Promise<void> {
        await ordercloudBulk.CreateAll(resource, records); 
        await ordercloudBulk.Run("SpecOption" as any, specDefaultOptionIDList, x => Specs.Patch(x.ID, { DefaultOptionID: x.DefaultOptionID }));
    }

    async function UploadApiClients(resource: OCResource): Promise<void> {
        records.forEach(r => {
            if (r.ClientSecret === REDACTED_MESSAGE) { 
                r.ClientSecret = Random.generateClientSecret();
            }
        });
        var results = await ordercloudBulk.CreateAll(resource, records);
        // Now that we have created the APIClients, we actually know what their IDs are.  
        for (var i = 0; i < records.length; i++) {
            apiClientIDMap[records[i].ID] = results[i].ID;
        }
    }

    async function UploadImpersonationConfigs(resource: OCResource): Promise<void> {
        records.forEach(r => r.ClientID = apiClientIDMap[r.ClientID]);
        await ordercloudBulk.CreateAll(resource, records);
    }

    async function UploadOpenIdConnects(resource: OCResource): Promise<void> {
        records.forEach(r => r.OrderCloudApiClientID = apiClientIDMap[r.OrderCloudApiClientID]);
        await ordercloudBulk.CreateAll(resource, records);
    }

    async function UploadCategories(resource: OCResource): Promise<void> {
        let depthCohort = records.filter(r => r.ParentID === null); // start with top-level
        while (depthCohort.length > 0) {
            // create in groups based on depth in the tree
            var results = await ordercloudBulk.CreateAll(resource, depthCohort);
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
        await ordercloudBulk.CreateAll(resource, records);
    }

    async function UploadIntegrationEvents(resource: OCResource): Promise<void> {
        records.forEach(r => {
            if (r.HashKey === REDACTED_MESSAGE) {
                r.HashKey = webhookSecret;
            }
        });
        await ordercloudBulk.CreateAll(resource, records);
    }

    async function UploadWebhooks(resource: OCResource): Promise<void> {
        records.forEach(r => {
            r.ApiClientIDs = r.ApiClientIDs.map(id => apiClientIDMap[id])
            if (r.HashKey === REDACTED_MESSAGE) {
                r.HashKey = webhookSecret;
            }
        });
        await ordercloudBulk.CreateAll(resource, records);
    }

    async function UploadApiClientAssignments(resource: OCResource): Promise<void> {
        records.forEach(r => r.ApiClientID = apiClientIDMap[r.ApiClientID]);
        await ordercloudBulk.CreateAll(resource, records);
    }
} 
