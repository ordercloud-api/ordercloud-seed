import { MARKETPLACE_ID_PLACEHOLDER } from "../../constants";
import { OCResourceEnum } from "../../models/oc-resource-enum";
import { ValidationFunc } from "../../models/oc-resource-metadata";

export const OwnerRefFieldValidationFunc: ValidationFunc = (context) => {
    let value = context.currentRecord[context.currentFieldName];

    if (
        !context.currentResource.hasSellerOwnerField || 
        context.currentFieldName !== context.currentResource.sellerOwnerReference.fieldNameOnThisResource ||
        value === MARKETPLACE_ID_PLACEHOLDER
        ) 
    {
        return;
    }
    var supplierExists = context.idCache.has(OCResourceEnum.Suppliers, value);
    if (!supplierExists) {
        context.addError(`Invalid reference ${context.currentResource.name}.${context.currentFieldName}: no ${OCResourceEnum.Suppliers} found with ID \"${value}\".`);
    }
}