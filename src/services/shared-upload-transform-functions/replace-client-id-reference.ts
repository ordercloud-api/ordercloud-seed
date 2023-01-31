import _ from "lodash";
import { UploadTransformFunc } from "../../models/oc-resource-metadata";

// Api Clients ID are globally unique across customers. This presents a challenge for seeding from a template with hard coded values.
// What the seeding tool does on upload is change the ID values but keep the structure of references the same. 
// apiClientIDMap translates between these.
export const ReplaceClientIDReference: UploadTransformFunc = (record, context) => {
    context.currentResource.apiClientRefFields.forEach(field => {
        let value = record[field];
        if (_.isNil(value)) {
            return;
        }
        if (_.isArray(value)) {
            // Should be Webhook.ApiClients
            record[field] = value.map(id => context.apiClientIDMap[id])
        } else {
            // Should be OpenIdConnect, ImpersonationConfig, ApiClientAssignment
            record[field] = context.apiClientIDMap[value]
        }
    })
}