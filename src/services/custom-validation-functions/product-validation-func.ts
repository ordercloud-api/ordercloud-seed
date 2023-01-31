import _ from "lodash";
import { OCResourceEnum } from "../../models/oc-resource-enum";
import { ValidationFunc } from "../../models/oc-resource-metadata";

export const ProductValidationFunc: ValidationFunc = (context) => {
    // This is all about validating ShipFromAddressID. It must be an address under the DefaultSupplierID (or marketplace owner if no supplier)

    var shipFromAddressID: string = context.currentRecord["ShipFromAddressID"];
    var defaultSupplierID: string = context.currentRecord["DefaultSupplierID"];

    var hasShipFromAddressID = !_.isNil(shipFromAddressID);
    var hasDefaultSupplierID = !_.isNil(defaultSupplierID);

    if (hasShipFromAddressID) {
        if (hasDefaultSupplierID) {
            // address must exist under supplier
            if (!context.idCache.has(OCResourceEnum.SupplierAddresses, [defaultSupplierID, shipFromAddressID])) {
                context.addError(`Invalid reference Product.ShipFromAddressID: no Supplier Address found with ID \"${shipFromAddressID}\" under DefaultSupplierID \"${defaultSupplierID}\".`)
            }
        } else {
            // address must exist under marketplace owner
            if (!context.idCache.has(OCResourceEnum.AdminAddresses, [shipFromAddressID])) {
                context.addError(`Invalid reference Product.ShipFromAddressID: no Admin Address found with ID \"${shipFromAddressID}\".`)
            }
        }
    }
}
