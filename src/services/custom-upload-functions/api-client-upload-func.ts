import { REDACTED_MESSAGE } from "../../constants";
import { BulkUploadFunc } from "../../models/oc-resource-metadata";
import Random from "../random";

// Need a custom upload function because unlike most resources we actually need the results for something.
export const ApiClientUploadFunc: BulkUploadFunc = async (context) => {
    var results = await context.defaultBulkCreate();
    // Now that we have created the APIClients, we actually know what their IDs are.  
    for (var i = 0; i < context.currentRecords.length; i++) {
        context.apiClientIDMap[context.currentRecords[i].ID] = results[i].ID;
    }
}