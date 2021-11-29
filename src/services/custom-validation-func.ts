import { Validator } from "../commands/validate";
import _ from 'lodash';
import { OCResourceEnum } from "../models/oc-resource-enum";
import { SerializedMarketplace } from "../models/serialized-marketplace";

export type RecordValidationFunc = (record: any, validator: Validator, allData: SerializedMarketplace) => void

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
        if (hasGroupID && !validator.idCache.has(OCResourceEnum.UserGroups, `${impersonationBuyerID}/${impersonationGroupID}`)) {
            validator.addError(`Invalid reference ImpersonationConfigs.ImpersonationGroupID: no UserGroup found with ID \"${impersonationGroupID}\" and BuyerID \"${impersonationBuyerID}\".`);
        }
        if (hasUserID && !validator.idCache.has(OCResourceEnum.Users, `${impersonationBuyerID}/${impersonationUserID}`)) {
            validator.addError(`Invalid reference ImpersonationConfigs.impersonationUserID: no User found with ID \"${impersonationUserID}\" and BuyerID \"${impersonationBuyerID}\".`);
        } 
    }
}

export const ProductAssignmentValidationFunc: RecordValidationFunc = (record, validator, allData) => {
    var productID: string = record["ProductID"];
    var priceScheduleID: string = record["PriceScheduleID"];
    var buyerID: string = record["BuyerID"];
    var userGroupID: string = record["UserGroupID"];
    var hasProductID = !_.isNil(productID);
    var hasPriceScheduleID = !_.isNil(priceScheduleID);
    var hasBuyerID = !_.isNil(buyerID);
    var hasUserGroupID = !_.isNil(userGroupID);

    if (hasBuyerID && hasProductID && hasPriceScheduleID) {
        // check price breaks exists
        var priceSchedule = allData.Objects[OCResourceEnum.PriceSchedules]?.find(x => x.ID === priceScheduleID);
        if (priceSchedule && (!priceSchedule?.PriceBreaks?.length || !priceSchedule?.PriceBreaks[0]?.Price)) {
            validator.addError(`Price Schedule with ID \"${priceScheduleID}\": must have at least one price break before it can be assigned to a product.`)
        }

        // check currencies match locale
        let localeAssignment;
        if (hasUserGroupID) {
            // check for a matching usergroup-level assignment
            localeAssignment = allData.Assignments[OCResourceEnum.LocaleAssignments]?.find(x => x.BuyerID === buyerID && x.UserGroupID == userGroupID);
            if (!localeAssignment) {
                // check for a matching buyer-level assignment
                localeAssignment = allData.Assignments[OCResourceEnum.LocaleAssignments]?.find(x => x.BuyerID === buyerID && _.isNil(x.UserGroupID));
            }
        } else {
            // there must be a matching buyer-level assignment
            localeAssignment = allData.Assignments[OCResourceEnum.LocaleAssignments]?.find(x => x.BuyerID === buyerID && _.isNil(x.UserGroupID));
        }    
        if (localeAssignment?.LocaleID) {
            var locale = allData.Objects[OCResourceEnum.Locales]?.find(x => x.ID === localeAssignment.LocaleID);

            if (locale.Currency !== priceSchedule.Currency) {
                validator.addError(`ProductAssignments: The party's assigned Locale must match the price schedule's currency. Price Schedule ID: \"${priceSchedule.ID}\". Locale ID: \"${locale.ID}\".`)
            }
        }
    }
}

export const LocaleAssignmentCustomValidationFunc: RecordValidationFunc = (record, validator) => {
    var buyerID: string = record["BuyerID"];
    var userID: string = record["UserID"];
    var hasBuyerID = !_.isNil(buyerID);
    var hasUserID = !_.isNil(userID);

    if (hasBuyerID && hasUserID && !validator.idCache.has(OCResourceEnum.Users, `${buyerID}/${userID}`)) {
        validator.addError(`Invalid reference LocaleAssignment.UserID: no User found with ID \"${userID}\" and BuyerID \"${buyerID}\".`)
    }
}

export const ApiClientValidationFunc: RecordValidationFunc = (record, validator) => {
    var defaultContextUsername: string = record["DefaultContextUserName"];
    if (!_.isNil(defaultContextUsername) && !validator.usernameCache.has(defaultContextUsername)) {
        validator.addError(`Invalid reference ApiClients.DefaultContextUserName: no User, SupplierUser or AdminUser found with Username \"${defaultContextUsername}\".`);
    }
}

export const WebhookValidationFunc: RecordValidationFunc = (record, validator) => {
    var apiClientIDs: string[] = record["ApiClientIDs"] ?? [];

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
        if (hasUserID && !validator.idCache.has(OCResourceEnum.SupplierUsers, `${supplierID}/${userID}`)) {
            validator.addError(`Invalid reference SecurityProfileAssignment.UserID: no SupplierUser found with ID \"${userID}\" and SupplierID \"${supplierID}\".`)
        }
        if (hasGroupID && !validator.idCache.has(OCResourceEnum.SupplierUserGroups, `${supplierID}/${groupID}`)) {
            validator.addError(`Invalid reference SecurityProfileAssignment.UserGroupID: no SupplierUserGroups found with ID \"${groupID}\" and SupplierID \"${supplierID}\".`)
        }
    } else if (hasBuyerID) {
        if (hasUserID && !validator.idCache.has(OCResourceEnum.Users, `${buyerID}/${userID}`)) {
            validator.addError(`Invalid reference SecurityProfileAssignment.UserID: no User found with ID \"${userID}\" and BuyerID \"${buyerID}\".`)
        }
        if (hasGroupID && !validator.idCache.has(OCResourceEnum.UserGroups, `${buyerID}/${groupID}`)) {
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