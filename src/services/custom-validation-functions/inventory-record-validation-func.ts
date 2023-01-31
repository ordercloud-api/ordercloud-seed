import _ from "lodash";
import { MARKETPLACE_ID_PLACEHOLDER } from "../../constants";
import { OCResourceEnum } from "../../models/oc-resource-enum";
import { ValidationFunc } from "../../models/oc-resource-metadata";

export const InventoryRecordValidationFunc: ValidationFunc = (context) => {
    var productID: string = context.currentRecord["ProductID"];
    var addressID: string = context.currentRecord["AddressID"];
    var ownerID: string = context.currentRecord["OwnerID"];
    var hasAddressID = !_.isNil(addressID);
    var hasOwnerID = !_.isNil(addressID);

    if (context.marketplaceData.Objects[OCResourceEnum.VariantInventoryRecords]?.some(x => x.ProductID === productID)) {
       return context.addError(`Invalid use of InventoryRecords and VariantInventoryRecords on product with ID \"${productID}\".`)
    }

    var product = context.marketplaceData.Objects[OCResourceEnum.Products]?.find(x => x.ID === productID);

    if (!!product?.Inventory?.VariantLevelTracking) {
        context.addError(`Invalid configuration for product with ID \"${productID}\": VariantLevelTracking must be false to create InventoryRecords at the product level.`)
    }

    if (hasAddressID && hasOwnerID) {
        if (ownerID === MARKETPLACE_ID_PLACEHOLDER) {
            if (!context.idCache.has(OCResourceEnum.AdminAddresses, [addressID])) {
                context.addError(`Invalid reference InventoryRecord.AddressID: no Admin Address found with ID \"${addressID}\".`)
            }
        } else {
            if (!context.idCache.has(OCResourceEnum.SupplierAddresses, [ownerID, addressID])) {
                context.addError(`Invalid reference InventoryRecord.AddressID: no Address found with ID \"${addressID}\" under supplier with ID \"${ownerID}\".`)
            }
        }
    }
}
