import _ from "lodash";
import { OCResourceEnum } from "../../models/oc-resource-enum";
import { ValidationFunc } from "../../models/oc-resource-metadata";

export const SecurityProfileAssignmentValidationFunc: ValidationFunc = (context) => {
    var buyerID: string = context.currentRecord["BuyerID"];
    var supplierID: string = context.currentRecord["SupplierID"];
    var userID: string = context.currentRecord["UserID"];
    var groupID: string = context.currentRecord["UserGroupID"];
    var hasBuyerID = !_.isNil(buyerID);
    var hasSupplierID = !_.isNil(supplierID);
    var hasUserID = !_.isNil(userID);
    var hasGroupID = !_.isNil(groupID);

    if (hasBuyerID && hasSupplierID) {
        return context.addError(`SecurityProfileAssignment error: cannot include both a BuyerID and a SupplierID`);
    } else if (hasSupplierID) {
        if (hasUserID && !context.idCache.has(OCResourceEnum.SupplierUsers, [supplierID, userID])) {
            context.addError(`Invalid reference SecurityProfileAssignment.UserID: no SupplierUser found with ID \"${userID}\" and SupplierID \"${supplierID}\".`)
        }
        if (hasGroupID && !context.idCache.has(OCResourceEnum.SupplierUserGroups, [supplierID, groupID])) {
            context.addError(`Invalid reference SecurityProfileAssignment.UserGroupID: no SupplierUserGroups found with ID \"${groupID}\" and SupplierID \"${supplierID}\".`)
        }
    } else if (hasBuyerID) {
        if (hasUserID && !context.idCache.has(OCResourceEnum.Users, [buyerID, userID])) {
            context.addError(`Invalid reference SecurityProfileAssignment.UserID: no User found with ID \"${userID}\" and BuyerID \"${buyerID}\".`)
        }
        if (hasGroupID && !context.idCache.has(OCResourceEnum.UserGroups, [buyerID, groupID])) {
            context.addError(`Invalid reference SecurityProfileAssignment.UserGroupID: no UserGroup found with ID \"${groupID}\" and BuyerID \"${buyerID}\".`)
        }
    } else {
        if (hasUserID && !context.idCache.has(OCResourceEnum.AdminUsers, [userID])) {
            context.addError(`Invalid reference SecurityProfileAssignment.UserID: no AdminUser found with ID \"${userID}\".`)
        }
        if (hasGroupID && !context.idCache.has(OCResourceEnum.AdminUserGroups, [groupID])) {
            context.addError(`Invalid reference SecurityProfileAssignment.UserGroupID: no AdminUserGroup found with ID \"${groupID}\".`)
        }
    }
}