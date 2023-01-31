import _ from "lodash";
import { MARKETPLACE_ID_PLACEHOLDER } from "../../constants";
import { OCResourceEnum } from "../../models/oc-resource-enum";
import { ValidationFunc } from "../../models/oc-resource-metadata";

export const SellerApprovalRuleValidationFunc: ValidationFunc = (context) => {
    var ownerID: string = context.currentRecord["OwnerID"];
    var approvingGroupID: string = context.currentRecord["ApprovingGroupID"];
    var hasOwnerID = !_.isNil(ownerID);
    var hasApprovingGroupID = !_.isNil(approvingGroupID);

    if (hasApprovingGroupID && hasOwnerID) {
        if (ownerID === MARKETPLACE_ID_PLACEHOLDER) {
            if (!context.idCache.has(OCResourceEnum.AdminUserGroups, [approvingGroupID])) {
                context.addError(`Invalid reference SellerApprovalRule.ApprovingGroupID: no Admin User Group found with ID \"${approvingGroupID}\".`)
            }
        } else {
            if (!context.idCache.has(OCResourceEnum.SupplierUserGroups, [ownerID, approvingGroupID])) {
                context.addError(`Invalid reference SellerApprovalRule.ApprovingGroupID: no User Group found with ID \"${approvingGroupID}\" under supplier with ID \"${ownerID}\".`)
            }
        }
    }
}
