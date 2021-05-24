import Portal from '../services/portal';
import { Configuration, Tokens } from 'ordercloud-javascript-sdk';
import OrderCloudBulk from '../services/ordercloud-bulk';
import _ from 'lodash';
import { log, MessageType } from '../services/log';
import { validate } from './validate';
import { BuildResourceDirectory } from '../models/oc-resource-directory';
import { OCResourceEnum } from '../models/oc-resource-enum';
import { OCResource } from '../models/oc-resources';

export async function upload(username: string, password: string, orgID: string, path: string) {
    // First run file validation
    var validateResponse = await validate(path);
    if (validateResponse.errors.length !== 0) return;

    // Run command input validation
    var missingInputs: string[] = [];

    if (!orgID) missingInputs.push("orgID");
    if (!username) missingInputs.push("username");
    if (!password) missingInputs.push("password");

    if (missingInputs.length >0) {
        return log(`Missing required arguments: ${missingInputs.join(", ")}`, MessageType.Error)
    }

    // Authenticate To Portal
    var portal_token: string;
    try {
        portal_token = await Portal.login(username, password);
    } catch {
        return log(`Username \"${username}\" and Password \"${password}\" were not valid`, MessageType.Error)
    }

    // Confirm orgID doesn't already exist
    try {
        await Portal.GetOrganization(orgID, portal_token);
        return log(`An organization with ID \"${orgID}\" already exists.`, MessageType.Error)
    } catch {}

    // Create Organization
    await Portal.PutOrganization({ Id: orgID, Name: orgID, Environment: "Sandbox" }, portal_token);
    log(`Created new Organization \"${orgID}\".`, MessageType.Success); 

    // Authenticate to Core API
    var org_token = await Portal.getOrganizationToken(orgID, portal_token);
    Configuration.Set({ baseApiUrl: "https://sandboxapi.ordercloud.io" });
    Tokens.SetAccessToken(org_token);
    
    // Upload to Ordercloud
    var file = validateResponse.data;
    var apiClientIDMap = {};
    var directory = await BuildResourceDirectory(false);
    for (let resource of directory.sort((a, b) => a.createPriority - b.createPriority)) {
        var records = file.GetRecords(resource);
        if (resource.name === OCResourceEnum.ApiClients) {
            await UploadApiClients(resource);
        } else if (resource.name === OCResourceEnum.ImpersonationConfigs) {
            await UploadImpersonationConfigs(resource);
        } else if (resource.name === OCResourceEnum.Webhooks) {
            await UploadWebhooks(resource);
        } else if (resource.name === OCResourceEnum.OpenIdConnects) {
            await UploadOpenIdConnects(resource);
        } else if (resource.name === OCResourceEnum.ApiClientAssignments) {
            await UploadApiClientAssignments(resource);
        } else {
            await OrderCloudBulk.CreateAll(resource, records);
        }
        log(`Uploaded ${records.length} ${resource.name}.`, MessageType.Progress); 
    }
    log(`Done Seeding!`, MessageType.Success); 


    async function UploadApiClients(resource: OCResource): Promise<void> {
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

    async function UploadWebhooks(resource: OCResource): Promise<void> {
        records.forEach(r => {
            r.ApiClientIDs = r.ApiClientIDs.map(id => apiClientIDMap[id])
        });
        await OrderCloudBulk.CreateAll(resource, records);
    }

    async function UploadApiClientAssignments(resource: OCResource): Promise<void> {
        records.forEach(r => r.ApiClientID = apiClientIDMap[r.ApiClientID]);
        await OrderCloudBulk.CreateAll(resource, records);
    }
} 
