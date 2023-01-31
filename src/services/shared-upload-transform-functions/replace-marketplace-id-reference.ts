import { MARKETPLACE_ID_PLACEHOLDER } from "../../constants";
import { UploadTransformFunc } from "../../models/oc-resource-metadata";

export const ReplaceMarketplaceIDReference: UploadTransformFunc = (record, context) => {
    if (context.currentResource.hasSellerOwnerField) {
        let fieldName = context.currentResource.sellerOwnerReference.fieldNameOnThisResource;
        if (record[fieldName] === MARKETPLACE_ID_PLACEHOLDER) {
            record[fieldName] = context.newMarketplaceID;
        }
    }
}