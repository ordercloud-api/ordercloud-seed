import _ from "lodash";
import { ValidationFunc } from "../../models/oc-resource-metadata";

// todo - need to validate duplicates that involve more fields that simply ID. e.g. xpindex 
export const DuplicateIDRecordValidationFunc: ValidationFunc = (context) => { 
    if (_.isNil(context.currentRecord.ID)) {
        return;
    }
    let ids = [context.currentRecord.ID];
    if (context.currentResource.isChild) {
        let parentRefField = context.currentResource.routeParamNames[0];
        ids.unshift(context.currentRecord[parentRefField])
    }
    if (context.idCache.has(context.currentResource.name, ids)) {
        var message = `Duplicate ID: multiple ${context.currentResource.name} with ID \"${context.currentRecord.ID}\"`;
        if (context.currentResource.isChild) {
            let parentRefField = context.currentResource.routeParamNames[0];
            message = message.concat(` within the ${parentRefField} \"${context.currentRecord[parentRefField]}\"`)
        }
        context.addError(message)
    } else {
        context.idCache.add(context.currentResource.name, context.currentRecord);
    }
}