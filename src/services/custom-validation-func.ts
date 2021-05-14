import { Validator } from "../actions/validate";
import _ from 'lodash';
import { OCResourceEnum } from "../models/oc-resource-enum";

export type RecordValidationFunc = (record: any, validator: Validator) => void

export interface CustomValidationResult {
    errors: string[];
}

export const ImpersonationConfigValidationFunc: RecordValidationFunc = (record, validator) => {
    var impersonationBuyerID: string = record["ImpersonationBuyerID"];
    var impersonationGroupID: string = record["ImpersonationGroupID"];
    var impersonationUserID: string = record["ImpersonationUserID"];
    var hasGroupID = !_.isNil(impersonationGroupID);
    var hasUserID = !_.isNil(impersonationUserID);

    if (_.isNil(impersonationBuyerID)) {
        if (hasGroupID && !validator.idCache.has(OCResourceEnum.AdminUserGroups, impersonationGroupID)) {
            validator.addError(`Invalid reference ImpersonationConfigs.ImpersonationGroupID: no AdminUserGroup found with ID \"${impersonationGroupID}\".`);
        }
        if (hasUserID && !validator.idCache.has(OCResourceEnum.AdminUsers, impersonationUserID)) {
            validator.addError(`Invalid reference ImpersonationConfigs.impersonationUserID: no AdminUser found with ID \"${impersonationUserID}\".`);
        }      
    } else {
        if (hasGroupID && !validator.idCache.has(OCResourceEnum.UserGroups, impersonationGroupID)) {
            validator.addError(`Invalid reference ImpersonationConfigs.ImpersonationGroupID: no UserGroup found with ID \"${impersonationGroupID}\" and BuyerID \"${impersonationBuyerID}\".`);
        }
        if (hasUserID && !validator.idCache.has(OCResourceEnum.Users, impersonationUserID)) {
            validator.addError(`Invalid reference ImpersonationConfigs.impersonationUserID: no User found with ID \"${impersonationUserID}\" and BuyerID \"${impersonationBuyerID}\".`);
        } 
    }
}

export const ApiClientValidationFunc: RecordValidationFunc = (record, validator) => {
    var defaultContextUsername: string = record["DefaultContextUsername"];

    if (!_.isNil(defaultContextUsername) && validator.usernameCache.has(defaultContextUsername)) {
        validator.addError(`Invalid reference ApiClients.DefaultContextUserName: no User, SupplierUser or AdminUser found with Username \"${defaultContextUsername}\".`);
    }
}

export const WebhookValidationFunc: RecordValidationFunc = (record, validator) => {
    var apiClientIDs: string[] = record["ApiClientIDs"] = [];

    var invalidIDs = apiClientIDs.filter(id => !validator.idCache.has(OCResourceEnum.ApiClients, id));
    if (invalidIDs.length !== 0) {
        validator.addError(`Invalid reference Webhooks.ApiClientIDs: could not find ApiClients with IDs ${invalidIDs.join(", ")}.`);
    }
}

export const SecurityProfileAssignmentValidationFunc: RecordValidationFunc = (record, validator) => {
    var buyerID: string = record["BuyerID"];
    var supplierID: string = record["SupplierID"];
    var userID: string = record["UserID"];
    var groupID: string = record["UserGroupID"];
    var hasBuyerID = !_.isNil(buyerID);
    var hasSupplierID = !_.isNil(supplierID);
    var hasUserID = !_.isNil(userID);
    var hasGroupID = !_.isNil(groupID);

    if (hasBuyerID && hasSupplierID) {
        return validator.addError(`SecurityProfileAssignment error: cannot include both a BuyerID and a SupplierID`);
    } else if (hasSupplierID) {
        if (hasUserID && !validator.idCache.has(OCResourceEnum.SupplierUsers, userID)) {
            validator.addError(`Invalid reference SecurityProfileAssignment.UserID: no SupplierUser found with ID \"${userID}\" and SupplierID \"${supplierID}\".`)
        }
        if (hasGroupID && !validator.idCache.has(OCResourceEnum.SupplierUserGroups, groupID)) {
            validator.addError(`Invalid reference SecurityProfileAssignment.UserGroupID: no SupplierUserGroups found with ID \"${groupID}\" and SupplierID \"${supplierID}\".`)
        }
    } else if (hasBuyerID) {
        if (hasUserID && !validator.idCache.has(OCResourceEnum.Users, userID)) {
            validator.addError(`Invalid reference SecurityProfileAssignment.UserID: no User found with ID \"${userID}\" and BuyerID \"${buyerID}\".`)
        }
        if (hasGroupID && !validator.idCache.has(OCResourceEnum.UserGroups, groupID)) {
            validator.addError(`Invalid reference SecurityProfileAssignment.UserGroupID: no UserGroup found with ID \"${groupID}\" and BuyerID \"${buyerID}\".`)
        }
    } else {
        if (hasUserID && !validator.idCache.has(OCResourceEnum.AdminUsers, userID)) {
            validator.addError(`Invalid reference SecurityProfileAssignment.UserID: no AdminUser found with ID \"${userID}\".`)
        }
        if (hasGroupID && !validator.idCache.has(OCResourceEnum.AdminUserGroups, groupID)) {
            validator.addError(`Invalid reference SecurityProfileAssignment.UserGroupID: no AdminUserGroup found with ID \"${groupID}\".`)
        }
    }
}