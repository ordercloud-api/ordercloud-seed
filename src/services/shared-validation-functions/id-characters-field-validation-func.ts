import { ValidationFunc } from "../../models/oc-resource-metadata";

export const IDCharacterFieldValidationFunc: ValidationFunc = (context) => {
    if (context.currentFieldName !== "ID") { 
        return;
    }
    let value = context.currentRecord.ID;
    var regex = /^[A-Za-z0-9_-]*$/;
    var isValid = regex.test(value);
    if (!isValid) {
        context.addError(`Invalid ID value \"${value}\". ID can only contain characters Aa-Zz 0-9 - _`);
    }
}