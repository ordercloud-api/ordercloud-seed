import _ from "lodash";
import { OCResourceEnum } from "../../models/oc-resource-enum";
import { ValidationFunc } from "../../models/oc-resource-metadata";

export const ProductAssignmentValidationFunc: ValidationFunc = (context) => {
    var productID: string = context.currentRecord["ProductID"];
    var priceScheduleID: string = context.currentRecord["PriceScheduleID"];
    var buyerID: string = context.currentRecord["BuyerID"];
    var userGroupID: string = context.currentRecord["UserGroupID"];
    var hasProductID = !_.isNil(productID);
    var hasPriceScheduleID = !_.isNil(priceScheduleID);
    var hasBuyerID = !_.isNil(buyerID);
    var hasUserGroupID = !_.isNil(userGroupID);

    if (hasBuyerID && hasProductID && hasPriceScheduleID) {
        // check price breaks exists
        var priceSchedule = context.marketplaceData.Objects[OCResourceEnum.PriceSchedules]?.find(x => x.ID === priceScheduleID);
        if (priceSchedule && (!priceSchedule?.PriceBreaks?.length || isNaN(priceSchedule?.PriceBreaks[0]?.Price))) {
            context.addError(`Price Schedule with ID \"${priceScheduleID}\": must have at least one valid price break before it can be assigned to a product.`)
        }

        // check currencies match locale
        let localeAssignment;
        if (hasUserGroupID) {
            // check for a matching usergroup-level assignment
            localeAssignment = context.marketplaceData.Assignments[OCResourceEnum.LocaleAssignments]?.find(x => x.BuyerID === buyerID && x.UserGroupID == userGroupID);
            if (!localeAssignment) {
                // check for a matching buyer-level assignment
                localeAssignment = context.marketplaceData.Assignments[OCResourceEnum.LocaleAssignments]?.find(x => x.BuyerID === buyerID && _.isNil(x.UserGroupID));
            }
        } else {
            // there must be a matching buyer-level assignment
            localeAssignment = context.marketplaceData.Assignments[OCResourceEnum.LocaleAssignments]?.find(x => x.BuyerID === buyerID && _.isNil(x.UserGroupID));
        }    
        if (localeAssignment?.LocaleID) {
            var locale = context.marketplaceData.Objects[OCResourceEnum.Locales]?.find(x => x.ID === localeAssignment.LocaleID);

            if (locale.Currency !== priceSchedule.Currency) {
                context.addError(`ProductAssignments: The party's assigned Locale must match the price schedule's currency. Price Schedule ID: \"${priceSchedule.ID}\". Locale ID: \"${locale.ID}\".`)
            }
        }
    }
}