import dotenv from 'dotenv';
import Portal from './portal.js'; // why do I have to add the .js here?
import { Configuration, Tokens } from 'ordercloud-javascript-sdk';
import { OCResourceDirectory } from './models/oc-resource-directory.js';
import SeedFile from './models/seed-file.js';


dotenv.config({ path: '.env' });

async function authenticate() {
    Configuration.Set({
        baseApiUrl: `https://${process.env.OC_ENV}api.ordercloud.io`,
    });
    
    var portal_token = await Portal.login(process.env.PORTAL_USERNAME, process.env.PORTAL_PASSWORD);
    var org_token = await Portal.getOrganizationToken(process.env.ORG_ID, portal_token);
    Tokens.SetAccessToken(org_token);
}

async function export_data() {
    var file = new SeedFile();
    
    for (let [resourceName, resource] of OCResourceDirectory) {
        if (resource.config.isChild) {
            continue; // resource will be handled as part of its parent
        }
        var records = await resource.listAll();
        file.AddRecords(resourceName, resource, records);
        for (let childResourceName of resource.config.children)
        {
            let childResource = OCResourceDirectory.get(childResourceName);
            for (let parentRecord of records) {
                var childRecords = await childResource.listAll(parentRecord.ID); // assume ID exists. Which is does for all parent types.
                for (let childRecord of childRecords) {
                    childRecord[childResource.config.parentRefFieldName] = parentRecord.ID;
                }
                file.AddRecords(childResourceName, childResource, childRecords);
            }
        }
        console.log("Finished ", resourceName);
    }
    file.WriteToYaml(); 
}

await authenticate()
await export_data();
