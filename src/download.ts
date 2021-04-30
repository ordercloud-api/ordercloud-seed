import dotenv from 'dotenv';
import Portal from './services/portal.js'; // why do I have to add the .js here?
import { Configuration, Tokens } from 'ordercloud-javascript-sdk';
import SeedFile from './models/seed-file.js';
import OrderCloudBulk from './services/ordercloud-bulk.js';
import { log } from './models/validate-response.js';
import { BuildResourceDirectory } from './models/oc-resource-directory.js';

dotenv.config({ path: '.env' }); // everything in here should be command line args eventually

async function download(username: string, password: string, env: string, orgID: string,) {
    // Set up configuration
    Configuration.Set({
        baseApiUrl: `https://${env}api.ordercloud.io`,
    });

    // Authenticate
    var portal_token = await Portal.login(username, password);
    var org_token = await Portal.getOrganizationToken(orgID, portal_token);
    Tokens.SetAccessToken(org_token);

    // Pull Data from Ordercloud
    var file = new SeedFile();  
    var directory = await BuildResourceDirectory(false) 
    for (let resource of directory) {
        if (resource.isChild) {
            continue; // resource will be handled as part of its parent
        }
        var records = await OrderCloudBulk.ListAll(resource);
        file.AddRecords(resource, records);
        for (let childResourceName of resource.children)
        {
            let childResource = directory.find(x => x.name == childResourceName);
            for (let parentRecord of records) {
                var childRecords = await OrderCloudBulk.ListAll(childResource, parentRecord.ID); // assume ID exists. Which is does for all parent types.
                for (let childRecord of childRecords) {
                    childRecord[childResource.parentRefFieldName] = parentRecord.ID;
                }
                file.AddRecords(childResource, childRecords);
            }
            log("Finished " + childRecords.length + " " + childResourceName);

        }
        log("Finished " + records.length + " " + resource.name);
    }
    // Write to file
    file.WriteToYaml('ordercloud-seed.yml');
} 

await download(process.env.PORTAL_USERNAME, process.env.PORTAL_PASSWORD, process.env.OC_ENV, process.env.ORG_ID);
