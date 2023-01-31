import _ from "lodash";
import { OCResourceEnum } from "../../models/oc-resource-enum";
import { ValidationFunc } from "../../models/oc-resource-metadata";

// TODO - delete by creating a multi-assignment concept. Need so api client swapping works correctly 
export const WebhookValidationFunc: ValidationFunc = (context) => {
    var apiClientIDs: string[] = context.currentRecord["ApiClientIDs"] ?? [];

    var invalidIDs = apiClientIDs.filter(apiClientID => !context.idCache.has(OCResourceEnum.ApiClients, [apiClientID]));
    if (invalidIDs.length !== 0) {
        context.addError(`Invalid reference Webhooks.ApiClientIDs: could not find ApiClients with IDs ${invalidIDs.join(", ")}.`);
    }
}