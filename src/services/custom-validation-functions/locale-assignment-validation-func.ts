import _ from "lodash";
import { OCResourceEnum } from "../../models/oc-resource-enum";
import { ValidationFunc } from "../../models/oc-resource-metadata";

export const LocaleAssignmentValidationFunc: ValidationFunc = (context) => {
    var buyerID: string = context.currentRecord["BuyerID"];
    var userID: string = context.currentRecord["UserID"];
    var hasBuyerID = !_.isNil(buyerID);
    var hasUserID = !_.isNil(userID);

    if (hasBuyerID && hasUserID && !context.idCache.has(OCResourceEnum.Users, [buyerID, userID])) {
        context.addError(`Invalid reference LocaleAssignment.UserID: no User found with ID \"${userID}\" and BuyerID \"${buyerID}\".`)
    }
}