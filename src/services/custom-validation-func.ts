import { Validator } from "../commands/validate";
import _, { find } from 'lodash';
import { OCResourceEnum } from "../models/oc-resource-enum";
import { SerializedMarketplace } from "../models/serialized-marketplace";
import { Spec, VariantSpec } from "ordercloud-javascript-sdk";
import { MARKETPLACE_ID } from "../constants";

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

export const ApiClientValidationFunc: RecordValidationFunc = (record, validator, allData) => {
    var defaultContextUsername: string = record["DefaultContextUserName"];
    var orderCheckoutIntegrationEventID: string = record["OrderCheckoutIntegrationEventID"];
    var orderReturnIntegrationEventID: string = record["OrderReturnIntegrationEventID"];

    if (!_.isNil(orderCheckoutIntegrationEventID)) {
        var event = allData.Objects[OCResourceEnum.IntegrationEvents]?.find(x => x.ID === orderCheckoutIntegrationEventID);
        if (event && event.EventType != "OrderCheckout") {
            validator.addError(`ApiClient.OrderCheckoutIntegrationEventID cannot have value "${orderCheckoutIntegrationEventID}" because this integration event does not have type "OrderCheckout".`);
        }
    }

    if (!_.isNil(orderReturnIntegrationEventID)) {
        var event = allData.Objects[OCResourceEnum.IntegrationEvents]?.find(x => x.ID === orderReturnIntegrationEventID);
        if (event && event.EventType != "OrderReturn") {
            validator.addError(`ApiClient.OrderReturnIntegrationEventID cannot have value "${orderReturnIntegrationEventID}" because this integration event does not have type "OrderReturn".`);
        }
    }

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

export const VariantValidationFunc: RecordValidationFunc = (record, validator, allData) => {
    var variantID: string = record["ID"];
    var productID: string = record["ProductID"]; 
    var actualSpecs: VariantSpec[] = record["Specs"] ?? [];
    var product = allData.Objects[OCResourceEnum.Products]?.find(x => x.ID === productID);

    if (_.isNil(productID) || _.isNil(product)) { return; } // error already addded

    if (actualSpecs.length === 0) {
        return validator.addError(`Invalid empty array Variant.Specs on Variant with ID \"${variantID}\": a variant must include at least one Spec.`);
    }

    var assignedSpecIDs = allData.Assignments[OCResourceEnum.SpecProductAssignments]?.filter(x => x.ProductID === productID)?.map(x => x.SpecID) ?? [];
    var expectedSpecs: Spec[] = allData.Objects[OCResourceEnum.Specs]?.filter(x => x.DefinesVariant && assignedSpecIDs.includes(x.ID)) ?? [];
    var alreadySeenSpecIds = [];

    for (var actual of actualSpecs) {
        if (alreadySeenSpecIds.includes(actual.SpecID)) {
            validator.addError(`Invalid duplicate SpecID \"${actual.SpecID}\" on Variant with ID \"${variantID}\": each spec should appear only once.`);
        }
        alreadySeenSpecIds.push(actual.SpecID);
        var specMatch = expectedSpecs.find((x => x.ID === actual.SpecID));
        if (!specMatch) {
            validator.addError(`Invalid reference Variant.Specs.SpecID on Variant with ID \"${variantID}\": spec ID \"${actual.SpecID}\" does not match an assigned spec with DefinesVariant.`);
        } else {
            var optionMatch = validator.idCache.has(OCResourceEnum.SpecOptions, `${specMatch.ID}/${actual.OptionID}`)
            if (!optionMatch) {
                validator.addError(`Invalid reference Variant.Specs.OptionID on Variant with ID \"${variantID}\": no option found with ID \"${actual.OptionID}\" on Spec with ID \"${actual.SpecID}\".`);
            }
        }
    }

    for (var expected of expectedSpecs) {
        var match = actualSpecs.find(x => x.SpecID === expected.ID);
        if (!match) {
            validator.addError(`Missing Spec on Variant \"${variantID}\": Specs property must specify an option for Spec with ID \"${expected.ID}\".`);
        }
    }
}

export const InventoryRecordValidation: RecordValidationFunc = (record, validator, allData) => {
    var productID: string = record["ProductID"];
    var addressID: string = record["AddressID"];
    var ownerID: string = record["OwnerID"];
    var hasAddressID = !_.isNil(addressID);
    var hasOwnerID = !_.isNil(addressID);

    if (allData.Objects[OCResourceEnum.VariantInventoryRecords]?.some(x => x.ProductID === productID)) {
       return validator.addError(`Invalid use of InventoryRecords and VariantInventoryRecords on product with ID \"${productID}\".`)
    }

    var product = allData.Objects[OCResourceEnum.Products]?.find(x => x.ID === productID);

    if (!!product?.Inventory?.VariantLevelTracking) {
        validator.addError(`Invalid configuration for product with ID \"${productID}\": VariantLevelTracking must be false to create InventoryRecords at the product level.`)
    }

    if (hasAddressID && hasOwnerID) {
        if (ownerID === MARKETPLACE_ID) {
            if (!validator.idCache.has(OCResourceEnum.AdminAddresses, addressID)) {
                validator.addError(`Invalid reference InventoryRecord.AddressID: no Admin Address found with ID \"${addressID}\".`)
            }
        } else {
            if (!validator.idCache.has(OCResourceEnum.SupplierAddresses, `${ownerID}/${addressID}`)) {
                validator.addError(`Invalid reference InventoryRecord.AddressID: no Address found with ID \"${addressID}\" under supplier with ID \"${ownerID}\".`)
            }
        }
    }
}

export const VariantInventoryRecordValidation: RecordValidationFunc = (record, validator, allData) => {
    var productID: string = record["ProductID"];
    var addressID: string = record["AddressID"];
    var ownerID: string = record["OwnerID"];
    var variantID: string = record["VariantID"]
    var hasAddressID = !_.isNil(addressID);
    var hasOwnerID = !_.isNil(ownerID);

    if (allData.Objects[OCResourceEnum.InventoryRecords]?.some(x => x.ProductID === productID)) {
        return validator.addError(`Invalid use of InventoryRecords and VariantInventoryRecords on product with ID \"${productID}\".`)
    }

    if (_.isNil(variantID)) {
        validator.addError(`Missing required property VariantInventoryRecord.VariantID.`)
    } else {
        if (!validator.idCache.has(OCResourceEnum.Variants, `${productID}/${variantID}`)) { 
            validator.addError(`Invalid reference VariantInventoryRecord.VariantID: no Variant found with ID \"${variantID}\" under product with ID \"${productID}\".`)
        }
    }

    var product = allData.Objects[OCResourceEnum.Products]?.find(x => x.ID === productID);

    if (!product?.Inventory?.VariantLevelTracking) {
        validator.addError(`Invalid configuration for product with ID \"${productID}\": VariantLevelTracking must be true to create InventoryRecords at the variant level.`)
    }

    if (hasAddressID && hasOwnerID) {
        if (ownerID === MARKETPLACE_ID) {
            if (!validator.idCache.has(OCResourceEnum.AdminAddresses, addressID)) {
                validator.addError(`Invalid reference InventoryRecord.AddressID: no Admin Address found with ID \"${addressID}\".`)
            }
        } else {
            if (!validator.idCache.has(OCResourceEnum.SupplierAddresses, `${ownerID}/${addressID}`)) {
                validator.addError(`Invalid reference InventoryRecord.AddressID: no Address found with ID \"${addressID}\" under supplier with ID \"${ownerID}\".`)
            }
        }
    }
}

export const SellerApprovalRuleValidationFunc: RecordValidationFunc = (record, validator) => {
    var ownerID: string = record["OwnerID"];
    var approvingGroupID: string = record["ApprovingGroupID"];
    var hasOwnerID = !_.isNil(ownerID);
    var hasApprovingGroupID = !_.isNil(approvingGroupID);

    if (hasApprovingGroupID && hasOwnerID) {
        if (ownerID === MARKETPLACE_ID) {
            if (!validator.idCache.has(OCResourceEnum.AdminUserGroups, approvingGroupID)) {
                validator.addError(`Invalid reference SellerApprovalRule.ApprovingGroupID: no Admin User Group found with ID \"${approvingGroupID}\".`)
            }
        } else {
            if (!validator.idCache.has(OCResourceEnum.SupplierUserGroups, `${ownerID}/${approvingGroupID}`)) {
                validator.addError(`Invalid reference SellerApprovalRule.ApprovingGroupID: no User Group found with ID \"${approvingGroupID}\" under supplier with ID \"${ownerID}\".`)
            }
        }
    }
}


