import { ValidationRunContext } from "../models/validation-run-context";
import { OpenAPIProperties, OpenAPIProperty, OpenAPIType } from "../models/open-api";
import { MARKETPLACE_ID_PLACEHOLDER } from "../constants";
import { OCResourceEnum } from "../models/oc-resource-enum";
import _ from "lodash";

interface CustomValidationsFunctionMap {
    [key: string]: (context: ValidationRunContext) => void
}

export class Validator {
    private static CustomValidationFuncs: CustomValidationsFunctionMap = {
        [OCResourceEnum.ApiClient]: this.ApiClientValidationFunc,
        [OCResourceEnum.ImpersonationConfig]: this.ImpersonationConfigValidationFunc,
        [OCResourceEnum.InventoryRecord]: this.InventoryRecordValidationFunc,
        [OCResourceEnum.LocaleAssignment]: this.LocaleAssignmentValidationFunc,
        [OCResourceEnum.ProductAssignment]: this.ProductAssignmentValidationFunc,
        [OCResourceEnum.Product]: this.ProductValidationFunc,
        [OCResourceEnum.SecurityProfile]: this.SecurityProfileAssignmentValidationFunc,
        [OCResourceEnum.SellerApprovalRule]: this.SellerApprovalRuleValidationFunc,
        [OCResourceEnum.VariantInventoryRecord]: this.VariantInventoryRecordValidationFunc,
        [OCResourceEnum.Variant]: this.VariantValidationFunc,
        [OCResourceEnum.Webhook]: this.WebhookValidationFunc,
    }

    static validate(context: ValidationRunContext) {
        for (let resource of context.directory.listResourceMetadata()) {
            context.currentResource = resource;
            var hasUsername = context.currentResource.hasUsernameField();
            var hasID = context.currentResource.hasIDField();
            if (hasID || hasUsername) {         
                for (let record of context.marketplaceData.GetRecords(resource)) {
                    context.currentRecord = record;   
                    if (hasID) {
                        // this step builds context.idCache, needed for reference validation. This why there are 2 top-level loops             
                        this.DuplicateIDRecordValidationFunc(context); 
                    } 
                    if (hasUsername) {
                        // this step builds context.usernameCache 
                        this.DuplicateUsernameRecordValidationFunc(context);
                    } 
                }
            }
        }
    
        // now that idSets are built, another loop for the rest of validation
        for (let resource of context.directory.listResourceMetadata()) {
            context.currentResource = resource
            for (let record of context.marketplaceData.GetRecords(resource)) {
                context.currentRecord = record;
                let fields: OpenAPIProperties = resource.openApiSpec.resourceSchema.properties;
                for (const [propName, spec] of Object.entries(fields)) {
                    context.currentFieldName = propName;
                    if (spec.readOnly) {
                        continue;
                    }
                    if (_.isNil(context.currentFieldValue)) {
                        this.RequiredFieldValidationFunc(context);
                    } else {
                        var typeMatches = this.TypeFieldValidationFunc(context, spec);
                        if (typeMatches) {
                            this.IDCharacterFieldValidationFunc(context);
                            this.OwnerRefFieldValidationFunc(context)
                            this.ReferenceFieldValidationFunc(context);
                            this.ParentRefFieldValidationFunc(context);
                        }
                    }
                }
                let customValidationFunc = this.CustomValidationFuncs[context.currentResource.name];
                if (customValidationFunc) {
                    customValidationFunc(context);
                }
            }
        }
    }

    // todo - need to validate duplicates that involve more fields that simply ID. e.g. xpindex 
    private static DuplicateIDRecordValidationFunc(context: ValidationRunContext): void {
        if (_.isNil(context.currentRecord.ID)) {
            return;
        }
        let ids = [context.currentRecord.ID];
        if (context.currentResource.isChild) {
            let parentRefField = context.currentResource.routeParamNames[0];
            ids.unshift(context.currentRecord[parentRefField])
        }
        if (context.idCache.has(context.currentResource.name, ids)) {
            var message = `Duplicate ID: multiple ${context.currentResource.name} with ID \"${context.currentRecord.ID}\"`;
            if (context.currentResource.isChild) {
                let parentRefField = context.currentResource.routeParamNames[0];
                message = message.concat(` within the ${parentRefField} \"${context.currentRecord[parentRefField]}\"`)
            }
            context.addError(message)
        } else {
            context.idCache.add(context.currentResource.name, context.currentRecord);
        }
    }

    // todo - need to validate duplicates that involve more fields that simply ID. e.g. xpindex 
    private static DuplicateUsernameRecordValidationFunc(context: ValidationRunContext): void {
        var username: string = context.currentRecord.Username;     
        if (_.isNil(username)) {
            return;
        }
        if (context.usernameCache.has(username)) {
            var message = `Duplicate Username: multiple users with username \"${username}\"`;
            context.addError(message)
        } else {
            context.usernameCache.add(username);
        }
    }

    private static IDCharacterFieldValidationFunc(context: ValidationRunContext): void {
        if (context.currentFieldName !== "ID") { 
            return;
        }
        let value = context.currentRecord.ID;
        var regex = /^[A-Za-z0-9_-]*$/;
        var isValid = regex.test(value);
        if (!isValid) {
            context.addError(`Invalid ID value \"${value}\". ID can only contain characters Aa-Zz 0-9 - _`);
        }
    }

    private static OwnerRefFieldValidationFunc(context: ValidationRunContext): void {
        let value = context.currentRecord[context.currentFieldName];

        if (
            !context.currentResource.hasSellerOwnerField || 
            context.currentFieldName !== context.currentResource.sellerOwnerReference.fieldNameOnThisResource ||
            value === MARKETPLACE_ID_PLACEHOLDER
            ) 
        {
            return;
        }
        var supplierExists = context.idCache.has(OCResourceEnum.Supplier, value);
        if (!supplierExists) {
            context.addError(`Invalid reference ${context.currentResource.name}.${context.currentFieldName}: no ${OCResourceEnum.Supplier} found with ID \"${value}\".`);
        }
    }

    private static ParentRefFieldValidationFunc(context: ValidationRunContext): void {
        var parentReference = context.currentResource.parentReference;
        if (
            !context.currentResource.isChild ||
            context.currentFieldName !== parentReference.fieldNameOnThisResource
        ) {
            return;
        }

        if (!context.idCache.has(parentReference.otherResourceName, context.currentFieldValue)) { // what about variants (child and parent)
            context.addError(`Invalid reference ${context.currentResource.name}.${context.currentFieldName}: no ${parentReference.otherResourceName} found with ID \"${context.currentFieldValue}\".`);
        }
    }

    private static ReferenceFieldValidationFunc(context: ValidationRunContext): void {
        var field = context.currentFieldName;
        var value = context.currentFieldValue;
        
        var setEntry = foreignKey.foreignParentRefField === undefined ? value : `${context.currentRecord[foreignKey.foreignParentRefField]}/${value}`;
        // find an ID of a particular resource
        var keyExists = context.idCache.has(foreignKey.otherResourceName, setEntry);
        if (!keyExists) {
            var message = `Invalid reference ${context.currentResource.name}.${field}: no ${foreignKey.otherResourceName} found with ID \"${value}\".`
            if (setEntry.includes('/')) {
                message = message.concat(` within the ${foreignKey.foreignParentRefField} \"${context.currentRecord[foreignKey.foreignParentRefField]}\"`)
            }
            context.addError(message);
        }
    }

    private static RequiredFieldValidationFunc(context: ValidationRunContext): void {
        if (
            _.isNil(context.currentFieldValue) &&
            context.currentResource.openApiSpec.requiredCreateFields.includes(context.currentFieldName)
        ) {
            context.addError(`Required field ${context.currentResource.name}.${context.currentFieldName}: cannot have value ${context.currentFieldValue}.`);
        }
    }

    // TODO - validate things inside objects or arrays
    private static TypeFieldValidationFunc(context:ValidationRunContext, spec: OpenAPIProperty): boolean {
        function getType(value: any): OpenAPIType {
            if (_.isArray(value)) return 'array';
            if (_.isPlainObject(value)) return 'object';
            if (_.isString(value)) return 'string';
            if (_.isBoolean(value)) return 'boolean'
            if (_.isInteger(value)) return 'integer';
            return 'number';
        }

        let value = context.currentFieldValue;
        // todo - need to do this differently. Get a swagger parser library
        if ((spec as any).allOf) {
            spec.type = "object";
        }
        var error: string = null;
        var typeError = `Incorrect type ${context.currentResource.name}.${context.currentFieldName}: ${value} is ${getType(value)}. Should be ${spec.type}.`;
        
        switch (spec.type) {
            case 'object':
                if (!_.isPlainObject(value)) error = typeError;
                break;  
            case 'array':
                if (!_.isArray(value)) error = typeError;
                break;
            case 'integer':
                if (!_.isInteger(value)) {
                    error = typeError;
                } else {
                    if ((spec.maximum || Infinity) < value) {
                        error = `Maximum for ${context.currentResource.name}.${context.currentFieldName} is ${spec.maximum}. Found ${value}.`;
                    }
                    if ((spec.minimum || -Infinity) > value) {
                        error =  `Minimum for ${context.currentResource.name}.${context.currentFieldName} is ${spec.minimum}. Found ${value}.`;
                    }
                }
                break;
            case 'number':
                if (!_.isNumber(value)) error = typeError;
                break;    
            case 'boolean':
                if (!_.isBoolean(value)) error = typeError;
                break;  
            case 'string':
                if (!_.isString(value)) { 
                    error = typeError;
                } else {
                    if ((spec.maxLength || Infinity) < value.length) {
                        error = `Max string length for ${context.currentResource.name}.${context.currentFieldName} is ${spec.maxLength}. Found \"${value}\".`;
                    }
                    if (spec.format === 'date-time' && !Date.parse(value)) {
                        error = `${context.currentResource.name}.${context.currentFieldName} should be a date format. Found \"${value}\".`;
                    }
                }        
                break;      
        }
        if (error !== null) {
            context.addError(error);
            return false;
        }
        return true;
    }

    private static ApiClientValidationFunc(context: ValidationRunContext): void {
        var defaultContextUsername: string = context.currentRecord["DefaultContextUserName"];
        var orderCheckoutIntegrationEventID: string = context.currentRecord["OrderCheckoutIntegrationEventID"];
        var orderReturnIntegrationEventID: string = context.currentRecord["OrderReturnIntegrationEventID"];
    
        if (!_.isNil(orderCheckoutIntegrationEventID)) {
            var event = context.marketplaceData.Objects[OCResourceEnum.IntegrationEvent]?.find(x => x.ID === orderCheckoutIntegrationEventID);
            if (event && event.EventType != "OrderCheckout") {
                context.addError(`ApiClient.OrderCheckoutIntegrationEventID cannot have value "${orderCheckoutIntegrationEventID}" because this integration event does not have type "OrderCheckout".`);
            }
        }
    
        if (!_.isNil(orderReturnIntegrationEventID)) {
            var event = context.marketplaceData.Objects[OCResourceEnum.IntegrationEvent]?.find(x => x.ID === orderReturnIntegrationEventID);
            if (event && event.EventType != "OrderReturn") {
                context.addError(`ApiClient.OrderReturnIntegrationEventID cannot have value "${orderReturnIntegrationEventID}" because this integration event does not have type "OrderReturn".`);
            }
        }
    
        if (!_.isNil(defaultContextUsername) && !context.usernameCache.has(defaultContextUsername)) {
            context.addError(`Invalid reference ApiClients.DefaultContextUserName: no User, SupplierUser or AdminUser found with Username \"${defaultContextUsername}\".`);
        }
    }

    private static ImpersonationConfigValidationFunc(context: ValidationRunContext): void {
        var impersonationBuyerID: string = context.currentRecord["ImpersonationBuyerID"];
        var impersonationGroupID: string = context.currentRecord["ImpersonationGroupID"];
        var impersonationUserID: string = context.currentRecord["ImpersonationUserID"];
        var hasGroupID = !_.isNil(impersonationGroupID);
        var hasUserID = !_.isNil(impersonationUserID);
    
        if (_.isNil(impersonationBuyerID)) {
            if (hasGroupID && !context.idCache.has(OCResourceEnum.AdminUserGroup, [impersonationGroupID])) {
                context.addError(`Invalid reference ImpersonationConfigs.ImpersonationGroupID: no AdminUserGroup found with ID \"${impersonationGroupID}\".`);
            }
            if (hasUserID && !context.idCache.has(OCResourceEnum.AdminUser, [impersonationUserID])) {
                context.addError(`Invalid reference ImpersonationConfigs.impersonationUserID: no AdminUser found with ID \"${impersonationUserID}\".`);
            }      
        } else {
            if (hasGroupID && !context.idCache.has(OCResourceEnum.UserGroup, [impersonationBuyerID, impersonationGroupID])) {
                context.addError(`Invalid reference ImpersonationConfigs.ImpersonationGroupID: no UserGroup found with ID \"${impersonationGroupID}\" and BuyerID \"${impersonationBuyerID}\".`);
            }
            if (hasUserID && !context.idCache.has(OCResourceEnum.User, [impersonationBuyerID, impersonationUserID])) {
                context.addError(`Invalid reference ImpersonationConfigs.impersonationUserID: no User found with ID \"${impersonationUserID}\" and BuyerID \"${impersonationBuyerID}\".`);
            } 
        }
    }

    private static InventoryRecordValidationFunc(context: ValidationRunContext): void {
        var productID: string = context.currentRecord["ProductID"];
        var addressID: string = context.currentRecord["AddressID"];
        var ownerID: string = context.currentRecord["OwnerID"];
        var hasAddressID = !_.isNil(addressID);
        var hasOwnerID = !_.isNil(addressID);
    
        if (context.marketplaceData.Objects[OCResourceEnum.VariantInventoryRecord]?.some(x => x.ProductID === productID)) {
           return context.addError(`Invalid use of InventoryRecords and VariantInventoryRecords on product with ID \"${productID}\".`)
        }
    
        var product = context.marketplaceData.Objects[OCResourceEnum.Product]?.find(x => x.ID === productID);
    
        if (!!product?.Inventory?.VariantLevelTracking) {
            context.addError(`Invalid configuration for product with ID \"${productID}\": VariantLevelTracking must be false to create InventoryRecords at the product level.`)
        }
    
        if (hasAddressID && hasOwnerID) {
            if (ownerID === MARKETPLACE_ID_PLACEHOLDER) {
                if (!context.idCache.has(OCResourceEnum.AdminAddress, [addressID])) {
                    context.addError(`Invalid reference InventoryRecord.AddressID: no Admin Address found with ID \"${addressID}\".`)
                }
            } else {
                if (!context.idCache.has(OCResourceEnum.SupplierAddress, [ownerID, addressID])) {
                    context.addError(`Invalid reference InventoryRecord.AddressID: no Address found with ID \"${addressID}\" under supplier with ID \"${ownerID}\".`)
                }
            }
        }
    }

    private static LocaleAssignmentValidationFunc(context: ValidationRunContext): void {
        var buyerID: string = context.currentRecord["BuyerID"];
        var userGroupID: string = context.currentRecord["UserGroupID"];
        var hasBuyerID = !_.isNil(buyerID);
        var hasUserGroupID = !_.isNil(userGroupID);
    
        if (hasBuyerID && hasUserGroupID && !context.idCache.has(OCResourceEnum.UserGroup, [buyerID, userGroupID])) {
            context.addError(`Invalid reference LocaleAssignment.UserGroupID: no UserGroup found with ID \"${userGroupID}\" and BuyerID \"${buyerID}\".`)
        }
    }

    private static ProductAssignmentValidationFunc(context: ValidationRunContext): void {
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
            var priceSchedule = context.marketplaceData.Objects[OCResourceEnum.PriceSchedule]?.find(x => x.ID === priceScheduleID);
            if (priceSchedule && (!priceSchedule?.PriceBreaks?.length || isNaN(priceSchedule?.PriceBreaks[0]?.Price))) {
                context.addError(`Price Schedule with ID \"${priceScheduleID}\": must have at least one valid price break before it can be assigned to a product.`)
            }
    
            // check currencies match locale
            let localeAssignment;
            if (hasUserGroupID) {
                // check for a matching usergroup-level assignment
                localeAssignment = context.marketplaceData.Assignments[OCResourceEnum.LocaleAssignment]?.find(x => x.BuyerID === buyerID && x.UserGroupID == userGroupID);
                if (!localeAssignment) {
                    // check for a matching buyer-level assignment
                    localeAssignment = context.marketplaceData.Assignments[OCResourceEnum.LocaleAssignment]?.find(x => x.BuyerID === buyerID && _.isNil(x.UserGroupID));
                }
            } else {
                // there must be a matching buyer-level assignment
                localeAssignment = context.marketplaceData.Assignments[OCResourceEnum.LocaleAssignment]?.find(x => x.BuyerID === buyerID && _.isNil(x.UserGroupID));
            }    
            if (localeAssignment?.LocaleID) {
                var locale = context.marketplaceData.Objects[OCResourceEnum.Locale]?.find(x => x.ID === localeAssignment.LocaleID);
    
                if (locale.Currency !== priceSchedule.Currency) {
                    context.addError(`ProductAssignments: The party's assigned Locale must match the price schedule's currency. Price Schedule ID: \"${priceSchedule.ID}\". Locale ID: \"${locale.ID}\".`)
                }
            }
        }
    }

    private static ProductValidationFunc(context: ValidationRunContext): void {
        // This is all about validating ShipFromAddressID. It must be an address under the DefaultSupplierID (or marketplace owner if no supplier)
    
        var shipFromAddressID: string = context.currentRecord["ShipFromAddressID"];
        var defaultSupplierID: string = context.currentRecord["DefaultSupplierID"];
    
        var hasShipFromAddressID = !_.isNil(shipFromAddressID);
        var hasDefaultSupplierID = !_.isNil(defaultSupplierID);
    
        if (hasShipFromAddressID) {
            if (hasDefaultSupplierID) {
                // address must exist under supplier
                if (!context.idCache.has(OCResourceEnum.SupplierAddress, [defaultSupplierID, shipFromAddressID])) {
                    context.addError(`Invalid reference Product.ShipFromAddressID: no Supplier Address found with ID \"${shipFromAddressID}\" under DefaultSupplierID \"${defaultSupplierID}\".`)
                }
            } else {
                // address must exist under marketplace owner
                if (!context.idCache.has(OCResourceEnum.AdminAddress, [shipFromAddressID])) {
                    context.addError(`Invalid reference Product.ShipFromAddressID: no Admin Address found with ID \"${shipFromAddressID}\".`)
                }
            }
        }
    }

    private static SecurityProfileAssignmentValidationFunc(context: ValidationRunContext): void {
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
            if (hasUserID && !context.idCache.has(OCResourceEnum.SupplierUser, [supplierID, userID])) {
                context.addError(`Invalid reference SecurityProfileAssignment.UserID: no SupplierUser found with ID \"${userID}\" and SupplierID \"${supplierID}\".`)
            }
            if (hasGroupID && !context.idCache.has(OCResourceEnum.SupplierUserGroup, [supplierID, groupID])) {
                context.addError(`Invalid reference SecurityProfileAssignment.UserGroupID: no SupplierUserGroups found with ID \"${groupID}\" and SupplierID \"${supplierID}\".`)
            }
        } else if (hasBuyerID) {
            if (hasUserID && !context.idCache.has(OCResourceEnum.User, [buyerID, userID])) {
                context.addError(`Invalid reference SecurityProfileAssignment.UserID: no User found with ID \"${userID}\" and BuyerID \"${buyerID}\".`)
            }
            if (hasGroupID && !context.idCache.has(OCResourceEnum.UserGroup, [buyerID, groupID])) {
                context.addError(`Invalid reference SecurityProfileAssignment.UserGroupID: no UserGroup found with ID \"${groupID}\" and BuyerID \"${buyerID}\".`)
            }
        } else {
            if (hasUserID && !context.idCache.has(OCResourceEnum.AdminUser, [userID])) {
                context.addError(`Invalid reference SecurityProfileAssignment.UserID: no AdminUser found with ID \"${userID}\".`)
            }
            if (hasGroupID && !context.idCache.has(OCResourceEnum.AdminUserGroup, [groupID])) {
                context.addError(`Invalid reference SecurityProfileAssignment.UserGroupID: no AdminUserGroup found with ID \"${groupID}\".`)
            }
        }
    }

    private static SellerApprovalRuleValidationFunc(context: ValidationRunContext): void {
        var ownerID: string = context.currentRecord["OwnerID"];
        var approvingGroupID: string = context.currentRecord["ApprovingGroupID"];
        var hasOwnerID = !_.isNil(ownerID);
        var hasApprovingGroupID = !_.isNil(approvingGroupID);
    
        if (hasApprovingGroupID && hasOwnerID) {
            if (ownerID === MARKETPLACE_ID_PLACEHOLDER) {
                if (!context.idCache.has(OCResourceEnum.AdminUserGroup, [approvingGroupID])) {
                    context.addError(`Invalid reference SellerApprovalRule.ApprovingGroupID: no Admin User Group found with ID \"${approvingGroupID}\".`)
                }
            } else {
                if (!context.idCache.has(OCResourceEnum.SupplierUserGroup, [ownerID, approvingGroupID])) {
                    context.addError(`Invalid reference SellerApprovalRule.ApprovingGroupID: no User Group found with ID \"${approvingGroupID}\" under supplier with ID \"${ownerID}\".`)
                }
            }
        }
    }

    private static VariantInventoryRecordValidationFunc(context: ValidationRunContext): void {
        var productID: string = context.currentRecord["ProductID"];
        var addressID: string = context.currentRecord["AddressID"];
        var ownerID: string = context.currentRecord["OwnerID"];
        var variantID: string = context.currentRecord["VariantID"]
        var hasAddressID = !_.isNil(addressID);
        var hasOwnerID = !_.isNil(ownerID);
    
        if (context.marketplaceData.Objects[OCResourceEnum.InventoryRecord]?.some(x => x.ProductID === productID)) {
            return context.addError(`Invalid use of InventoryRecords and VariantInventoryRecords on product with ID \"${productID}\".`)
        }
    
        if (_.isNil(variantID)) {
            context.addError(`Missing required property VariantInventoryRecord.VariantID.`)
        } else {
            if (!context.idCache.has(OCResourceEnum.Variant, [productID, variantID])) { 
                context.addError(`Invalid reference VariantInventoryRecord.VariantID: no Variant found with ID \"${variantID}\" under product with ID \"${productID}\".`)
            }
        }
    
        var product = context.marketplaceData.Objects[OCResourceEnum.Product]?.find(x => x.ID === productID);
    
        if (!product?.Inventory?.VariantLevelTracking) {
            context.addError(`Invalid configuration for product with ID \"${productID}\": VariantLevelTracking must be true to create InventoryRecords at the variant level.`)
        }
    
        if (hasAddressID && hasOwnerID) {
            if (ownerID === MARKETPLACE_ID_PLACEHOLDER) {
                if (!context.idCache.has(OCResourceEnum.AdminAddress, [addressID])) {
                    context.addError(`Invalid reference InventoryRecord.AddressID: no Admin Address found with ID \"${addressID}\".`)
                }
            } else {
                if (!context.idCache.has(OCResourceEnum.SupplierAddress, [ownerID, addressID])) {
                    context.addError(`Invalid reference InventoryRecord.AddressID: no Address found with ID \"${addressID}\" under supplier with ID \"${ownerID}\".`)
                }
            }
        }
    }

    private static VariantValidationFunc(context: ValidationRunContext): void {
        var variantID: string = context.currentRecord["ID"];
        var productID: string = context.currentRecord["ProductID"]; 
        var actualSpecs: VariantSpec[] = context.currentRecord["Specs"] ?? [];
        var product = context.marketplaceData.Objects[OCResourceEnum.Product]?.find(x => x.ID === productID);
    
        if (_.isNil(productID) || _.isNil(product)) { return; } // error already addded
    
        if (actualSpecs.length === 0) {
            return context.addError(`Invalid empty array Variant.Specs on Variant with ID \"${variantID}\": a variant must include at least one Spec.`);
        }
    
        var assignedSpecIDs = context.marketplaceData.Assignments[OCResourceEnum.SpecProductAssignment]?.filter(x => x.ProductID === productID)?.map(x => x.SpecID) ?? [];
        var expectedSpecs: Spec[] = context.marketplaceData.Objects[OCResourceEnum.Spec]?.filter(x => x.DefinesVariant && assignedSpecIDs.includes(x.ID)) ?? [];
        var alreadySeenSpecIds = [];
    
        for (var actual of actualSpecs) {
            if (alreadySeenSpecIds.includes(actual.SpecID)) {
                context.addError(`Invalid duplicate SpecID \"${actual.SpecID}\" on Variant with ID \"${variantID}\": each spec should appear only once.`);
            }
            alreadySeenSpecIds.push(actual.SpecID);
            var specMatch = expectedSpecs.find((x => x.ID === actual.SpecID));
            if (!specMatch) {
                context.addError(`Invalid reference Variant.Specs.SpecID on Variant with ID \"${variantID}\": spec ID \"${actual.SpecID}\" does not match an assigned spec with DefinesVariant.`);
            } else {
                var optionMatch = context.idCache.has(OCResourceEnum.SpecOption, [specMatch.ID, actual.OptionID])
                if (!optionMatch) {
                    context.addError(`Invalid reference Variant.Specs.OptionID on Variant with ID \"${variantID}\": no option found with ID \"${actual.OptionID}\" on Spec with ID \"${actual.SpecID}\".`);
                }
            }
        }
    
        for (var expected of expectedSpecs) {
            var match = actualSpecs.find(x => x.SpecID === expected.ID);
            if (!match) {
                context.addError(`Missing Spec on Variant \"${variantID}\": Specs property must specify an option for Spec with ID \"${expected.ID}\".`);
            }
        }
    }

    // TODO - delete by creating a multi-assignment concept. Need so api client swapping works correctly 
    private static WebhookValidationFunc(context: ValidationRunContext): void {
        var apiClientIDs: string[] = context.currentRecord["ApiClientIDs"] ?? [];

        var invalidIDs = apiClientIDs.filter(apiClientID => !context.idCache.has(OCResourceEnum.ApiClient, [apiClientID]));
        if (invalidIDs.length !== 0) {
            context.addError(`Invalid reference Webhooks.ApiClientIDs: could not find ApiClients with IDs ${invalidIDs.join(", ")}.`);
        }
    }
}
