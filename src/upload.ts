// import dotenv from 'dotenv';
// import Portal from './services/portal.js'; // why do I have to add the .js here?
// import { Configuration, Tokens } from 'ordercloud-javascript-sdk';
// import { OCResourceDirectory } from './models/oc-resource-directory.js';
// import SeedFile from './models/seed-file.js';
// import { OCResourceEnum } from './models/oc-resource-enum.js';
// import OrderCloudBulk from './services/ordercloud-bulk.js';
// import { ApplyDefaults } from './models/oc-resources.js';

// dotenv.config({ path: '.env' }); // everything in here should be command line args eventually

// async function upload(username: string, password: string, env: string) {
//     // Set up configuration
//     Configuration.Set({
//         baseApiUrl: `https://${env}api.ordercloud.io`,
//     });

//     // Authenticate
//     var portal_token = await Portal.login(username, password);
//     var orgID = `Oliver_${Date.now()}` // command line arg or something
//     await Portal.CreateOrganization({ Id: orgID, Name: orgID, Environment: "Sandbox" }, portal_token)
//     var org_token = await Portal.getOrganizationToken(orgID, portal_token);
//     Tokens.SetAccessToken(org_token);

//     // Read from file
//     var file = new SeedFile();   
//     file.ReadFromYaml('ordercloud-seed.yml');
    
//     // Upload to Ordercloud
//     // var directory = OCResourceDirectory.map(ApplyDefaults); 
//     // for (let resource of directory.sort((a, b) => a.createPriority - b.createPriority)) {
//     //     var records = file.GetRecords(resource);
//     //     if (resource.parentRefFieldName) {
//     //         var routeParam = resource[]
//     //     } else {

//     //     }
//     // } 
//     //var sp = directory.find(x => x.name == OCResourceEnum.SecurityProfiles);
//     //var securityProfiles = file.GetRecords(sp);
//     //await OrderCloudBulk.CreateAll(sp, securityProfiles);
// } 

// await upload(process.env.PORTAL_USERNAME, process.env.PORTAL_PASSWORD, process.env.OC_ENV);
