import Portal from '../services/portal'; // why do I have to add the .js here?
import { Configuration, Tokens } from 'ordercloud-javascript-sdk';
import SeedFile from '../models/seed-file';
import OrderCloudBulk from '../services/ordercloud-bulk';
import { log, MessageType } from '../services/log';
import { BuildResourceDirectory } from '../models/oc-resource-directory';
import jwt_decode from "jwt-decode";
import { OCResource } from '../models/oc-resources';
import _ from 'lodash';
import dotenv from 'dotenv';

export async function download(username: string, password: string, environment: string, orgID: string): Promise<void> {
    var missingInputs: string[] = [];
    var validEnvironments = ['staging', 'sandbox', 'prod'];
    var urls = {
        staging: "https://stagingapi.ordercloud.io",
        sandbox: "https://sandboxapi.ordercloud.io",
        prod: "https://api.ordercloud.io",
    };

    if (!environment) missingInputs.push("environment");
    if (!orgID) missingInputs.push("orgID");
    if (!username) missingInputs.push("username");
    if (!password) missingInputs.push("password");

    if (missingInputs.length >0) {
        return log(`Missing required arguments: ${missingInputs.join(", ")}`, MessageType.Error)
    }

    if (!validEnvironments.includes(environment)) {
        return log(`environment must be one of ${validEnvironments.join(", ")}`, MessageType.Error)
    }

    var url = urls[environment];

    // Set up configuration
    Configuration.Set({ baseApiUrl: url });

    // Authenticate
    var portal_token: string;
    var org_token: string;
    try {
        portal_token = await Portal.login(username, password);
    } catch {
        return log(`Username \"${username}\" and Password \"${password}\" were not valid`, MessageType.Error)
    }
    try {
        org_token = await Portal.getOrganizationToken(orgID, portal_token);
    } catch {
        return log(`Organization with ID \"${orgID}\" not found`, MessageType.Error)
    }
    var decoded = jwt_decode(org_token) as any;

    if (decoded.aud !== url) {
        return log(`Organization \"${orgID}\" found, but is not in specified environment \"${environment}\"`, MessageType.Error)
    }

    Tokens.SetAccessToken(org_token);

    log("Found your organization. Beginning download.", MessageType.Success);

    // Pull Data from Ordercloud
    var file = new SeedFile();  
    var directory = await BuildResourceDirectory(false); 
    for (let key in directory) {
        var resource = directory[key];
        if (resource.isChild) {
            continue; // resource will be handled as part of its parent
        }
        var records = await OrderCloudBulk.ListAll(resource);
        RedactSensitiveFields(resource, records);
        if (resource.downloadTransformFunc !== undefined) {
            records = records.map(resource.downloadTransformFunc)
        }
        file.AddRecords(resource, records);
        for (let childResourceName of resource.children)
        {
            let childResource = directory[childResourceName];
            for (let parentRecord of records) {
                var childRecords = await OrderCloudBulk.ListAll(childResource, parentRecord.ID); // assume ID exists. Which is does for all parent types.
                for (let childRecord of childRecords) {
                    childRecord[childResource.parentRefField] = parentRecord.ID;
                }
                if (childResource.downloadTransformFunc !== undefined) {
                    childRecords = childRecords.map(resource.downloadTransformFunc)
                }
                file.AddRecords(childResource, childRecords);
            }
            log("Finished " + childRecords.length + " " + childResourceName);
        }
        log("Finished " + records.length + " " + resource.name);
    }
    // Write to file
    file.WriteToYaml('ordercloud-seed.yml');
    log("Done! Wrote to file \"ordercloud-seed.yml\"", MessageType.Success);

    function RedactSensitiveFields(resource: OCResource, records: any[]): void {
        if (resource.redactFields.length === 0) return;

        for (var record of records) {
            for (var field of resource.redactFields) {
                if (!_.isNil(record[field])) {
                    record[field] = "<Redacted for Security>";
                }
            }
        }
    }
} 

dotenv.config({ path: '.env' });

download(process.env.PORTAL_USERNAME, process.env.PORTAL_PASSWORD, process.env.OC_ENV, process.env.ORG_ID);