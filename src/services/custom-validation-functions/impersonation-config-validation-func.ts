import _ from "lodash";
import { OCResourceEnum } from "../../models/oc-resource-enum";
import { ValidationFunc } from "../../models/oc-resource-metadata";

export const ImpersonationConfigValidationFunc: ValidationFunc = (context) => {
    var impersonationBuyerID: string = context.currentRecord["ImpersonationBuyerID"];
    var impersonationGroupID: string = context.currentRecord["ImpersonationGroupID"];
    var impersonationUserID: string = context.currentRecord["ImpersonationUserID"];
    var hasGroupID = !_.isNil(impersonationGroupID);
    var hasUserID = !_.isNil(impersonationUserID);

    if (_.isNil(impersonationBuyerID)) {
        if (hasGroupID && !context.idCache.has(OCResourceEnum.AdminUserGroups, [impersonationGroupID])) {
            context.addError(`Invalid reference ImpersonationConfigs.ImpersonationGroupID: no AdminUserGroup found with ID \"${impersonationGroupID}\".`);
        }
        if (hasUserID && !context.idCache.has(OCResourceEnum.AdminUsers, [impersonationUserID])) {
            context.addError(`Invalid reference ImpersonationConfigs.impersonationUserID: no AdminUser found with ID \"${impersonationUserID}\".`);
        }      
    } else {
        if (hasGroupID && !context.idCache.has(OCResourceEnum.UserGroups, [impersonationBuyerID, impersonationGroupID])) {
            context.addError(`Invalid reference ImpersonationConfigs.ImpersonationGroupID: no UserGroup found with ID \"${impersonationGroupID}\" and BuyerID \"${impersonationBuyerID}\".`);
        }
        if (hasUserID && !context.idCache.has(OCResourceEnum.Users, [impersonationBuyerID, impersonationUserID])) {
            context.addError(`Invalid reference ImpersonationConfigs.impersonationUserID: no User found with ID \"${impersonationUserID}\" and BuyerID \"${impersonationBuyerID}\".`);
        } 
    }
}