import { ValidationFunc } from "../../models/oc-resource-metadata";

export const ReferenceFieldValidationFunc: ValidationFunc = (context) => {
    var field = context.currentFieldName;
    var value = context.currentFieldValue;
    
    var setEntry = foreignKey.foreignParentRefField === undefined ? value : `${context.currentRecord[foreignKey.foreignParentRefField]}/${value}`;
    // find an ID of a particular resource
    var keyExists = context.idCache.has(foreignKey.otherResourceName, setEntry);
    if (!keyExists) {
        var message = `Invalid reference ${context.currentResource.name}.${field}: no ${foreignKey.otherResourceName} found with ID \"${value}\".`
        if (setEntry.includes('/')) {
            message = message.concat(` within the ${foreignKey.foreignParentRefField} \"${context.currentRecord[foreignKey.foreignParentRefField]}\"`)
        }
        context.addError(message);
    }
}