import * as SeedingTemplates from '../../seeds/meta.json';
import { Configuration, InventoryRecords, Product, Products, Specs, Tokens, Variant } from 'ordercloud-javascript-sdk';
import OrderCloudBulk from '../services/ordercloud-bulk';
import _ from 'lodash';
import { defaultLogger, getElapsedTime, LogCallBackFunc, MessageType } from '../services/logger';
import { validate } from './validate';
import { BuildOCResourceDirectory } from '../models/oc-resource-directory';
import { OCResourceEnum } from '../models/oc-resource-enum';
import Random from '../services/random';
import { REDACTED_MESSAGE,MARKETPLACE_ID_PLACEHOLDER, TEN_MINUTES } from '../constants';
import PortalAPI from '../services/portal';
import { SerializedMarketplace } from '../models/serialized-marketplace';
import { ApiClient } from '@ordercloud/portal-javascript-sdk';
import Bottleneck from 'bottleneck';
import { JobActionType, JobGroupMetaData } from '../models/job-metadata';
import { RefreshTimer } from '../services/refresh-timer';
import { UploadContext } from '../models/upload-context';
import { ReplaceRedactedFields } from '../services/shared-upload-transform-functions/replace-redacted-fields';
import { ReplaceClientIDReference } from '../services/shared-upload-transform-functions/replace-client-id-reference';
import { ReplaceMarketplaceIDReference } from '../services/shared-upload-transform-functions/replace-marketplace-id-reference';

export interface SeedArgs {
    username?: string;
    password?: string; 
    marketplaceID?: string;
    marketplaceName?: string;
    portalToken?: string;
    dataUrl?: string;
    rawData?: SerializedMarketplace;
    regionId?: string;
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
        marketplaceID = Random.generateOrgID(), 
        marketplaceName,
        portalToken,
        rawData,
        dataUrl,
        regionId = "usw",
        logger = defaultLogger
    } = args;
    var startTime = Date.now();

    // Check if the args contain an alias for a example seed template
    var template = SeedingTemplates.templates.find(x => x.name === dataUrl);
    if (!_.isNil(template)) {
        dataUrl = template.dataUrl;
    }
    
    // Run validation on the shape of the seed data
    var validateResponse = await validate({ rawData, dataUrl});
    if (validateResponse?.errors?.length !== 0) return;

    // Authenticate To Portal
    var portal = new PortalAPI();
    var portalRefreshToken: string;
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

    // Confirm orgID doesn't already exist
    try {
        await portal.GetOrganization(marketplaceID, portalToken);
        return logger(`A marketplace with ID \"${marketplaceID}\" already exists.`, MessageType.Error)
    } catch {}

    // Create Marketplace
    marketplaceName = marketplaceName || dataUrl?.split("/")?.pop()?.split(".")[0] || marketplaceID;
    try
    {
        await portal.CreateOrganization(marketplaceID, marketplaceName, portalToken, regionId);
    }
    catch(exception)
    {
        logger(`Couldn't create marketplace with Name \"${marketplaceName}\" and ID \"${marketplaceID}\" in the region \"${regionId}\" because: \n\"${exception.response.data.Errors[0].Message}\"`, MessageType.Error);
        return;
    }
    
    logger(`Created new marketplace with Name \"${marketplaceName}\" and ID \"${marketplaceID}\".`, MessageType.Success); 

    var organization = await portal.GetOrganization(marketplaceID, portalToken);

    if(!organization)
    {
        logger(`Couldn't get the newly created organization with name \"${marketplaceName}\" and ID \"${marketplaceID}\".`, MessageType.Error);
        return;
    }

    if(!organization.CoreApiUrl.includes("sandbox"))
    {
        logger(`Seeding is not allowed for production accounts. Marketplace name \"${marketplaceName}\" and ID \"${marketplaceID}\".`, MessageType.Error);
        return;
    }

    logger(`Seeding the newly created marketplace using api url \"${organization.CoreApiUrl}\".`, MessageType.Success);

    // Authenticate to Core API
    var org_token = await portal.getOrganizationToken(marketplaceID, portalToken);
    Configuration.Set({ baseApiUrl: organization.CoreApiUrl }); // always sandbox for upload
    Tokens.SetAccessToken(org_token);
    
    // Upload to Ordercloud
    var marketplaceData = new SerializedMarketplace(validateResponse.rawData);
    var ordercloudBulk = new OrderCloudBulk(new Bottleneck({
        minTime: 100,
        maxConcurrent: 8
    }), logger);
    var directory = await BuildOCResourceDirectory();
    var context = new UploadContext(marketplaceID, directory, marketplaceData, ordercloudBulk, logger);
    for (let resource of context.directory.listResourceMetadata().sort((a, b) => a.createPriority - b.createPriority)) {
        context.currentResource = resource;
        context.currentRecords = marketplaceData.GetRecords(resource);
        context.currentRecords.forEach(record => {
            ReplaceRedactedFields(record, context);
            ReplaceMarketplaceIDReference(record, context);
            ReplaceClientIDReference(record, context);
            record = context.currentResource.uploadTransformFunc(record, context);
        });
        await context.currentResource.customBulkUploadFunc(context);

        if (context.currentRecords.length != 0) {
            logger(`Created ${context.currentRecords.length} ${resource.name}.`, MessageType.Info);
        }   
    }

    var endTime = Date.now();
    logger(`Done! Seeded a new marketplace with ID \"${marketplaceID}\" and Name \"${marketplaceName}\". Total elapsed time: ${getElapsedTime(startTime, endTime)}`, MessageType.Done); 

    var results =  {
        marketplaceName,
        marketplaceID,
        accessToken: org_token,
        apiClients: context.getNewlyCreatedApiClientRecords()
    }

    return results;

    async function UploadImpersonationConfigs(context: UploadContext): Promise<void> {
        records.forEach(r => r.ClientID = context.apiClientIDMap[r.ClientID]);
        await ordercloudBulk.CreateAll(resource, records);
    }

    async function UploadOpenIdConnects(context: UploadContext): Promise<void> {
        records.forEach(r => r.OrderCloudApiClientID = context.apiClientIDMap[r.OrderCloudApiClientID]);
        await ordercloudBulk.CreateAll(resource, records);
    }


    async function UploadWebhooks(context: UploadContext): Promise<void> {
        records.forEach(r => {
            r.ApiClientIDs = r.ApiClientIDs.map(id => context.apiClientIDMap[id])
        });
        await ordercloudBulk.CreateAll(resource, records);
    }

    async function UploadApiClientAssignments(context: UploadContext): Promise<void> {
        records.forEach(r => r.ApiClientID = context.apiClientIDMap[r.ApiClientID]);
        await ordercloudBulk.CreateAll(resource, records);
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
