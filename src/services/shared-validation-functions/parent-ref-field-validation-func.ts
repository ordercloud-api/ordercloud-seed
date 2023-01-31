import { ValidationFunc } from "../../models/oc-resource-metadata";

export const ParentRefFieldValidationFunc: ValidationFunc = (context) => {
    var parentReference = context.currentResource.parentReference;
    if (
        !context.currentResource.isChild ||
        context.currentFieldName !== parentReference.fieldNameOnThisResource
    ){
        return;
    }

    if (!context.idCache.has(parentReference.otherResourceName, context.currentFieldValue)) { // what about variants (child and parent)
        context.addError(`Invalid reference ${context.currentResource.name}.${context.currentFieldName}: no ${parentReference.otherResourceName} found with ID \"${context.currentFieldValue}\".`);
    }
}