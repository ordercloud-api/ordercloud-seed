import axios from "axios";
import { Addresses, AdminAddresses, InventoryRecords, AdminUserGroups, AdminUsers, ApiClients, ApprovalRules, Buyers, Catalogs, Categories, CostCenters, CreditCards, ImpersonationConfigs, Incrementors, IntegrationEvents, Locales, MessageSenders, OpenIdConnects, PriceSchedules, ProductFacets, Products, Promotions, SecurityProfiles, Specs, SpendingAccounts, SupplierAddresses, Suppliers, SupplierUserGroups, SupplierUsers, UserGroups, Users, Webhooks, XpIndices, SellerApprovalRules } from "ordercloud-javascript-sdk";
import { OCResourceEnum } from "./oc-resource-enum";
import { OCResourceMetaData as OCResourceMetadata, OCResourceMetaDataHardCoded, RecordValidationFunc, ResourceReference, ResourceReferenceType } from "./oc-resources";
import _ from 'lodash';
import { OpenAPIProperties } from "./open-api";
import { ImpersonationConfigValidationFunc } from "../services/custom-validation-functions/ImpersonationConfigValidationFunc";
import { ApiClientValidationFunc } from "../services/custom-validation-functions/ApiClientValidationFunc";
import { WebhookValidationFunc } from "../services/custom-validation-functions/WebhookValidationFunc";
import { ProductValidationFunc } from "../services/custom-validation-functions/ProductValidationFunc";
import { VariantValidationFunc } from "../services/custom-validation-functions/VariantValidationFunc";
import { InventoryRecordValidationFunc } from "../services/custom-validation-functions/InventoryRecordValidationFunc";
import { VariantInventoryRecordValidationFunc } from "../services/custom-validation-functions/VariantInventoryRecordValidationFunc";
import { SellerApprovalRuleValidationFunc } from "../services/custom-validation-functions/SellerApprovalRuleValidationFunc";
import { SecurityProfileAssignmentValidationFunc } from "../services/custom-validation-functions/SecurityProfileAssignmentValidationFunc";
import { LocaleAssignmentValidationFunc } from "../services/custom-validation-functions/LocaleAssignmentValidationFunc";
import { ProductAssignmentValidationFunc } from "../services/custom-validation-functions/ProductAssignmentValidationFunc";

interface OCResourcesMetaData {
    [key: string]: OCResourceMetadata
}

interface OCResourcesMetaDataHardCoded {
    [key: string]: OCResourceMetaDataHardCoded
}

const ocResourceMetaDataHardCoded: OCResourcesMetaDataHardCoded = {
    [OCResourceEnum.SecurityProfiles]: { 
        openApiSpec: {
            schemaName: 'SecurityProfile',
            resourceCreatePath: "/securityprofiles",
            listFunction: SecurityProfiles.List,
            createFunction: SecurityProfiles.Create
        }, 
        createPriority: 2,
        isAssignment: false,
    },
    [OCResourceEnum.ImpersonationConfigs]: { 
        openApiSpec: {
            schemaName: 'ImpersonationConfig',
            resourceCreatePath: "/impersonationconfig",
            listFunction: ImpersonationConfigs.List,
            createFunction: ImpersonationConfigs.Create
        }, 
        createPriority: 7,
        isAssignment: false,
        customValidationFunc: ImpersonationConfigValidationFunc,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "ClientID",
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.ApiClients,  
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "SecurityProfileID", 
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.SecurityProfiles,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "BuyerID", 
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.Buyers, 
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "GroupID",
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.UserGroups,
            },
            { 
                referenceType: ResourceReferenceType.Reference,  
                fieldNameOnThisResource: "UserID",
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.Users,
            },
            { 
                referenceType: ResourceReferenceType.Reference, 
                fieldNameOnThisResource: "ImpersonationBuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
        ]
    },
    [OCResourceEnum.OpenIdConnects]: {
        openApiSpec: {
            schemaName: 'OpenIdConnect',
            resourceCreatePath: "/openidconnects",
            listFunction: OpenIdConnects.List,
            createFunction: OpenIdConnects.Create
        }, 
        createPriority: 7,
        isAssignment: false,
        redactFields: ["ConnectClientSecret"],
        outgoingResourceReferences: 
        [
            { 
                referenceType: ResourceReferenceType.Reference,  
                fieldNameOnThisResource: "OrderCloudApiClientID",
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.ApiClients,
            },
            { 
                referenceType: ResourceReferenceType.Reference, 
                fieldNameOnThisResource: "IntegrationEventID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.IntegrationEvents,
            }
        ]
    },
    [OCResourceEnum.AdminUsers]: {
        openApiSpec: {
            schemaName: 'UserGroup',
            resourceCreatePath: "/adminusers",
            listFunction: AdminUsers.List,
            createFunction: AdminUsers.Create
        }, 
        createPriority: 2,
        isAssignment: false,
        downloadTransformFunc: (x) => { 
            delete x.Locale;
            delete x.CompanyID; // this is always a reference to the marketplace ID. 
            return x;
        }
    },
    [OCResourceEnum.AdminUserGroups]: {
        openApiSpec: {
            schemaName: 'UserGroup',
            resourceCreatePath: "/usergroups",
            listFunction: AdminUserGroups.List,
            createFunction: AdminUserGroups.Create
        },  
        createPriority: 2,
        isAssignment: false,
    },
    [OCResourceEnum.AdminAddresses]: {
        openApiSpec: {
            schemaName: 'Address',
            resourceCreatePath: "/addresses",
            listFunction: AdminAddresses.List,
            createFunction: AdminAddresses.Create
        }, 
        createPriority: 2,
        isAssignment: false,
    },
    [OCResourceEnum.MessageSenders]: {
        openApiSpec: {
            schemaName: 'MessageSender',
            resourceCreatePath: "/messagesenders",
            listFunction: MessageSenders.List,
            createFunction: MessageSenders.Create
        }, 
        createPriority: 2,
        isAssignment: false,
        redactFields: ["SharedKey"],
    },
    [OCResourceEnum.ApiClients]: {
        openApiSpec: {
            schemaName: 'ApiClient',
            resourceCreatePath: "/apiclients",
            listFunction: ApiClients.List,
            createFunction: ApiClients.Create
        }, 
        createPriority: 6,
        isAssignment: false,
        redactFields: ["ClientSecret"],
        outgoingResourceReferences:
        [
            { 
                referenceType: ResourceReferenceType.Reference,  
                fieldNameOnThisResource: "OrderCheckoutIntegrationEventID",
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.IntegrationEvents,
            },
            { 
                referenceType: ResourceReferenceType.Reference, 
                fieldNameOnThisResource: "OrderReturnIntegrationEventID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.IntegrationEvents,
            },
            { 
                referenceType: ResourceReferenceType.Reference, 
                fieldNameOnThisResource: "AddToCartIntegrationEventID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.IntegrationEvents,
            },
        ],
        downloadTransformFunc: (x) => {
            x.ID = x.ID.toLowerCase(); // funky platform thing with API CLient ID casing
            return x;
        },
        customValidationFunc: ApiClientValidationFunc, 
    },
    [OCResourceEnum.Locales]: {
        openApiSpec: {
            schemaName: 'Locale',
            resourceCreatePath: "/locales",
            listFunction: Incrementors.List,
            createFunction: Incrementors.Create
        },
        createPriority: 3,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Owner,
                fieldNameOnThisResource: "OwnerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ],
    },
    [OCResourceEnum.Incrementors]: {
        openApiSpec: {
            schemaName: 'Incrementor',
            resourceCreatePath: "/incrementors",
            listFunction: Incrementors.List,
            createFunction: Incrementors.Create
        }, 
        createPriority: 1,
        isAssignment: false,
    },
    [OCResourceEnum.Webhooks]: {
        openApiSpec: {
            schemaName: "Webhook",
            resourceCreatePath: "/webhooks",
            listFunction: Webhooks.List,
            createFunction: Webhooks.Create
        }, 
        createPriority: 7,
        isAssignment: false,
        redactFields: ["HashKey"],
        // for .ApiClientIDs
        customValidationFunc: WebhookValidationFunc
    },
    [OCResourceEnum.IntegrationEvents]: {
        openApiSpec: {
            schemaName: "IntegrationEvent",
            resourceCreatePath: "/integrationEvents",
            listFunction: IntegrationEvents.List,
            createFunction: IntegrationEvents.Create
        },  
        createPriority: 2,
        isAssignment: false,
        redactFields: ["HashKey"],
    },
    [OCResourceEnum.XpIndices]: {
        openApiSpec: {
            schemaName: "XpIndex",
            resourceCreatePath: "/xpindices",
            listFunction: XpIndices.List,
            createFunction: XpIndices.Put
        }, 
        createPriority: 1,
        isAssignment: false,
    },
    [OCResourceEnum.Buyers]: {
        openApiSpec: {
            schemaName: "User",
            resourceCreatePath: "/buyers",
            listFunction: Buyers.List,
            createFunction: Buyers.Create
        }, 
        createPriority: 4,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Reference, 
                fieldNameOnThisResource: "DefaultCatalogID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Catalogs,
            }
        ]
    },
    [OCResourceEnum.Users]: {
        openApiSpec: {
            schemaName: "User",
            resourceCreatePath: "/buyers/{buyerID}/users",
            listFunction: Users.List,
            createFunction: Users.Create
        }, 
        routeParams: ["BuyerID"],
        createPriority: 5,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
        ],
        downloadTransformFunc: (x) => { 
            delete x.Locale;
            return x;
        }
    },
    [OCResourceEnum.UserGroups]: {
        openApiSpec: {
            schemaName: "UserGroup",
            resourceCreatePath: "/buyers/{buyerID}/usergroups",
            listFunction: UserGroups.List,
            createFunction: UserGroups.Create
        }, 
        routeParams: ["BuyerID"],
        createPriority: 5,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
        ],
    },
    [OCResourceEnum.Addresses]: {
        openApiSpec: {
            schemaName: "Address",
            resourceCreatePath: "/buyers/{buyerID}/addresses",
            listFunction: Addresses.List,
            createFunction: Addresses.Create
        }, 
        routeParams: ["BuyerID"],
        createPriority: 5,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
        ],
    },
    [OCResourceEnum.CostCenters]: {
        openApiSpec: {
            schemaName: "CostCenter",
            resourceCreatePath: "/buyers/{buyerID}/costcenters",
            listFunction: CostCenters.List,
            createFunction: CostCenters.Create
        },
        routeParams: ["BuyerID"],
        createPriority: 5,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
        ],
    },
    [OCResourceEnum.CreditCards]: {
        openApiSpec: {
            schemaName: "CreditCard",
            resourceCreatePath: "/buyers/{buyerID}/creditcards",
            listFunction: CreditCards.List,
            createFunction: CreditCards.Create
        }, 
        routeParams: ["BuyerID"],
        createPriority: 5,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
        ],
    },
    [OCResourceEnum.SpendingAccounts]: {
        openApiSpec: {
            schemaName: "SpendingAccount",
            resourceCreatePath: "/buyers/{buyerID}/spendingaccounts",
            listFunction: SpendingAccounts.List,
            createFunction: SpendingAccounts.Create
        }, 
        routeParams: ["BuyerID"],
        createPriority: 5,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
        ]
    },
    [OCResourceEnum.ApprovalRules]: {
        openApiSpec: {
            schemaName: "ApprovalRule",
            resourceCreatePath: "/buyers/{buyerID}/approvalrules",
            listFunction: ApprovalRules.List,
            createFunction: ApprovalRules.Create
        },
        routeParams: ["BuyerID"], 
        createPriority: 6,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                fieldNameOnThisResource: "ApprovingGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
                referenceType: ResourceReferenceType.Reference,
            }
        ]
    },
    [OCResourceEnum.Catalogs]: {
        openApiSpec: {
            schemaName: "Catalog",
            resourceCreatePath: "/catalogs",
            listFunction: Catalogs.List,
            createFunction: Catalogs.Create
        }, 
        createPriority: 3,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Owner,
                fieldNameOnThisResource: "OwnerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ]
    },
    [OCResourceEnum.Categories]: {
        openApiSpec: {
            schemaName: "Category",
            resourceCreatePath: "/catalogs/{catalogID}/categories",
            listFunction: Categories.List,
            createFunction: Categories.Create
        },
        routeParams: ["CatalogID"],
        createPriority: 4,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "CatalogID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Catalogs,
            },
            { 
                fieldNameOnThisResource: "CatalogID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Categories,
                referenceType: ResourceReferenceType.Reference,
            }
        ]
    },
    [OCResourceEnum.Suppliers]: {
        openApiSpec: {
            schemaName: "Supplier",
            resourceCreatePath: "/suppliers",
            listFunction: Suppliers.List,
            createFunction: Suppliers.Create
        },
        createPriority: 2,
        isAssignment: false,
    },
    [OCResourceEnum.SupplierUsers]: {
        openApiSpec: {
            schemaName: "User",
            resourceCreatePath: "/suppliers/{supplierID}/users",
            listFunction: SupplierUsers.List,
            createFunction: SupplierUsers.Create
        },
        routeParams: ["SupplierID"],
        createPriority: 3,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "SupplierID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ],
        downloadTransformFunc: (x) => { 
            delete x.Locale;
            return x;
        }
    },
    [OCResourceEnum.SupplierUserGroups]: {
        openApiSpec: {
            schemaName: "UserGroup",
            resourceCreatePath: "/suppliers/{supplierID}/usergroups",
            listFunction: SupplierUserGroups.List,
            createFunction: SupplierUserGroups.Create
        },
        routeParams: ["SupplierID"],
        createPriority: 3,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "SupplierID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ],
    },
    [OCResourceEnum.SupplierAddresses]: {
        openApiSpec: {
            schemaName: "Address",
            resourceCreatePath: "/suppliers/{supplierID}/addresses",
            listFunction: SupplierAddresses.List,
            createFunction: SupplierAddresses.Create
        },
        routeParams: ["SupplierID"],
        createPriority: 3,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "SupplierID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ]
    },
    [OCResourceEnum.Products]: {
        openApiSpec: {
            schemaName: "Product",
            resourceCreatePath: "/products",
            listFunction: Products.List,
            createFunction: Products.Create
        },
        createPriority: 4,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Owner,
                fieldNameOnThisResource: "OwnerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "DefaultPriceScheduleID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.PriceSchedules,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "DefaultSupplierID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ],
        customValidationFunc: ProductValidationFunc
    },
    [OCResourceEnum.PriceSchedules]: {
        openApiSpec: {
            schemaName: "PriceSchedule",
            resourceCreatePath: "/priceschedules",
            listFunction: PriceSchedules.List,
            createFunction: PriceSchedules.Create
        },  
        createPriority: 3,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Owner,
                fieldNameOnThisResource: "OwnerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ]
    },
    [OCResourceEnum.Specs]: {
        openApiSpec: {
            schemaName: "Spec",
            resourceCreatePath: "/specs",
            listFunction: Specs.List,
            createFunction: Specs.Create
        }, 
        createPriority: 3,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Owner,
                fieldNameOnThisResource: "OwnerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "DefaultOptionID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SpecOptions,
            },
        ],
    },
    [OCResourceEnum.SpecOptions]: {
        openApiSpec: {
            schemaName: "SpecOption",
            resourceCreatePath: "/specs/{specID}/options",
            listFunction: Specs.ListOptions,
            createFunction: Specs.CreateOption
        }, 
        routeParams: ["SpecID"],
        createPriority: 4,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "SpecID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Specs,
            },
        ]
    },
    [OCResourceEnum.ProductFacets]: {
        openApiSpec: {
            schemaName: "ProductFacet",
            resourceCreatePath: "/productfacets",
            listFunction: ProductFacets.List,
            createFunction: ProductFacets.Create
        }, 
        createPriority: 2,
        isAssignment: false,
    },
    [OCResourceEnum.Promotions]: {
        openApiSpec: {
            schemaName: "Promotion",
            resourceCreatePath: "/promotions",
            listFunction: Promotions.List,
            createFunction: Promotions.Create
        }, 
        createPriority: 3,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Owner,
                fieldNameOnThisResource: "OwnerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ],
    },
    [OCResourceEnum.Variants]: {
        openApiSpec: {
            schemaName: "Variant",
            resourceCreatePath: "/products/{productID}/variants",
            listFunction: Products.ListVariants,
            createFunction: null // variants are generated
        }, 
        routeParams: ["ProductID"],
        createPriority: 6,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "ProductID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
        ],
        customValidationFunc: VariantValidationFunc,
        shouldAttemptListFunc: (product) => (product?.VariantCount > 0)
    },
    [OCResourceEnum.InventoryRecords]: {
        openApiSpec: {
            schemaName: "InventoryRecord",
            resourceCreatePath: "/products/{productID}/inventoryrecords",
            listFunction: InventoryRecords.List,
            createFunction: InventoryRecords.Create
        },
        routeParams: ["ProductID"],
        createPriority: 5,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "ProductID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
            { 
                referenceType: ResourceReferenceType.Owner,
                fieldNameOnThisResource: "OwnerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ],
        customValidationFunc: InventoryRecordValidationFunc,
    },
    [OCResourceEnum.VariantInventoryRecords]: {
        openApiSpec: {
            schemaName: "InventoryRecord",
            resourceCreatePath: "/products/{productID}/variants/{variantID}/inventoryrecords",
            listFunction: InventoryRecords.ListVariant,
            createFunction: InventoryRecords.CreateVariant
        },
        createPriority: 7,
        isAssignment: false,
        routeParams: ["ProductID", "VariantID"],
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "ProductID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
            { 
                referenceType: ResourceReferenceType.Owner,
                fieldNameOnThisResource: "OwnerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "VariantID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Variants,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "ProductID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
        ],
        customValidationFunc: VariantInventoryRecordValidationFunc,
    },
    [OCResourceEnum.SellerApprovalRules]: {
        openApiSpec: {
            schemaName: "SellerApprovalRule",
            resourceCreatePath: "/approvalrules",
            listFunction: SellerApprovalRules.List,
            createFunction: SellerApprovalRules.Create
        },
        createPriority: 4,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Owner,
                fieldNameOnThisResource: "OwnerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ],
        customValidationFunc: SellerApprovalRuleValidationFunc
    },
    [OCResourceEnum.SecurityProfileAssignments]: {
        openApiSpec: {
            schemaName: "SecurityProfileAssignment",
            resourceCreatePath: "/securityprofiles/assignments",
            listFunction: SecurityProfiles.ListAssignments,
            createFunction: SecurityProfiles.SaveAssignment
        },
        createPriority: 6,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "SecurityProfileID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SecurityProfiles,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "SupplierID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ], 
        customValidationFunc: SecurityProfileAssignmentValidationFunc
    },
    [OCResourceEnum.AdminUserGroupAssignments]: {
        openApiSpec: {
            schemaName: "UserGroupAssignment",
            resourceCreatePath: "/usergroups/assignments",
            listFunction: AdminUserGroups.ListUserAssignments,
            createFunction: AdminUserGroups.SaveUserAssignment
        },
        createPriority: 3,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.AdminUsers,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.AdminUserGroups,
            },
        ]
    },
    [OCResourceEnum.ApiClientAssignments]: {
        openApiSpec: {
            schemaName: "ApiClientAssignment",
            resourceCreatePath: "/apiclients/assignments",
            listFunction: ApiClients.SaveAssignment,
            createFunction: ApiClients.ListAssignments
        },
        createPriority: 7,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "ApiClientID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.ApiClients,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "SupplierID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ],
        downloadTransformFunc: (x) => {
            x.ApiClientID = x.ApiClientID.toLowerCase(); // funky platform thing with API CLient ID casing
            return x;
        },
    },
    [OCResourceEnum.LocaleAssignments]: {
        openApiSpec: {
            schemaName: "LocaleAssignment",
            resourceCreatePath: "/locales/assignments",
            listFunction: Locales.SaveAssignment,
            createFunction: Locales.ListAssignments
        },
        createPriority: 6,
        isAssignment: true,
        customValidationFunc: LocaleAssignmentValidationFunc,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "LocaleID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Locales,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Users,
            },
        ],
    },
    [OCResourceEnum.UserGroupAssignments]: {
        openApiSpec: {
            schemaName: "UserGroupAssignment",
            resourceCreatePath: "/buyers/{buyerID}/usergroups/assignments",
            listFunction: UserGroups.SaveUserAssignment,
            createFunction: UserGroups.ListUserAssignments
        },
        routeParams: ["BuyerID"],
        createPriority: 6,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Users,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
            },
        ],           
    },
    [OCResourceEnum.AddressAssignments]: {
        openApiSpec: {
            schemaName: "AddressAssignment",
            resourceCreatePath: "/buyers/{buyerID}/addresses/assignments",
            listFunction: Addresses.ListAssignments,
            createFunction: Addresses.SaveAssignment
        },
        routeParams: ["BuyerID"],
        createPriority: 6,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "AddressID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Addresses,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Users,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
            },
        ],
    },
    [OCResourceEnum.CostCenterAssignments]: {
        openApiSpec: {
            schemaName: "CostCenterAssignment",
            resourceCreatePath: "/buyers/{buyerID}/costcenters",
            listFunction: CostCenters.ListAssignments,
            createFunction: CostCenters.SaveAssignment
        },
        routeParams: ["BuyerID"],
        createPriority: 6,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "CostCenterID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.CostCenters,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
            },
        ],       
    },
    [OCResourceEnum.CreditCardAssignments]: {
        openApiSpec: {
            schemaName: "CreditCardAssignment",
            resourceCreatePath: "/buyers/{buyerID}/creditcards/assignments",
            listFunction: CreditCards.ListAssignments,
            createFunction: CreditCards.SaveAssignment
        },
        routeParams: ["BuyerID"],
        createPriority: 6,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "CreditCardID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.CreditCards,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Users,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
            },
        ],
    },
    [OCResourceEnum.SpendingAccountAssignments]: {
        openApiSpec: {
            schemaName: "SpendingAccountAssignment",
            resourceCreatePath: "/buyers/{buyerID}/spendingaccounts/assignments",
            listFunction: SpendingAccounts.ListAssignments,
            createFunction: SpendingAccounts.SaveAssignment
        },
        routeParams: ["BuyerID"],
        createPriority: 6,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "SpendingAccountID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SpendingAccounts,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Users,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
            },
        ],   
    },
    [OCResourceEnum.SupplierUserGroupsAssignments]: {
        openApiSpec: {
            schemaName: "UserGroupAssignment",
            resourceCreatePath: "/suppliers/{supplierID}/usergroups/assignments",
            listFunction: SupplierUserGroups.ListUserAssignments,
            createFunction: SupplierUserGroups.SaveUserAssignment
        },
        routeParams: ["SupplierID"],
        createPriority: 4,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "SupplierID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SupplierUsers,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SupplierUserGroups,
            },
        ],           
    },
    [OCResourceEnum.ProductAssignments]: {
        openApiSpec: {
            schemaName: "ProductAssignment",
            resourceCreatePath: "/products/assignments",
            listFunction: Products.ListAssignments,
            createFunction: Products.SaveAssignment
        },
        createPriority: 6,
        isAssignment: true,
        customValidationFunc: ProductAssignmentValidationFunc,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Owner,
                fieldNameOnThisResource: "SellerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "ProductID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "PriceScheduleID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.PriceSchedules,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
            },
        ],         
    },
    [OCResourceEnum.CatalogAssignments]: {
        openApiSpec: {
            schemaName: "CatalogAssignment",
            resourceCreatePath: "/catalogs/assignments",
            listFunction: Catalogs.ListAssignments,
            createFunction: Catalogs.SaveAssignment
        },
        createPriority: 5,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "CatalogID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Catalogs,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
        ]           
    },
    [OCResourceEnum.ProductCatalogAssignment]: {
        openApiSpec: {
            schemaName: "ProductCatalogAssignment",
            resourceCreatePath: "/catalogs/productassignments",
            listFunction: Catalogs.ListProductAssignments,
            createFunction: Catalogs.SaveProductAssignment
        },
        createPriority: 5,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "CatalogID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Catalogs,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "ProductID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
        ]                   
    },
    [OCResourceEnum.CategoryAssignments]: {
        openApiSpec: {
            schemaName: "CategoryAssignment",
            resourceCreatePath: "/catalogs/{catalogID}/categories/assignments",
            listFunction: Categories.ListAssignments,
            createFunction: Categories.SaveAssignment
        },
        routeParams: ["CatalogID"],
        createPriority: 6,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "CatalogID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Catalogs,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "CategoryID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Categories,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
            },
        ]           
    },
    [OCResourceEnum.CategoryProductAssignments]: {
        openApiSpec: {
            schemaName: "CategoryProductAssignment",
            resourceCreatePath: "/catalogs/{catalogID}/categories/productassignments",
            listFunction: Categories.ListProductAssignments,
            createFunction: Categories.SaveProductAssignment
        },
        routeParams: ["CatalogID"],
        createPriority: 5,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "CatalogID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Catalogs,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "CategoryID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Categories,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "ProductID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
        ]           
    },
    [OCResourceEnum.SpecProductAssignments]: {
        openApiSpec: {
            schemaName: "SpecProductAssignment",
            resourceCreatePath: "/specs/productassignments",
            listFunction: Specs.ListProductAssignments,
            createFunction: Specs.SaveProductAssignment
        },
        createPriority: 5,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "SpecID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Specs,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "ProductID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "DefaultOptionID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SpecOptions,
            },
        ]
    },
    [OCResourceEnum.PromotionAssignments]: {
        openApiSpec: {
            schemaName: "PromotionAssignment",
            resourceCreatePath: "/promotions/assignments",
            listFunction: Promotions.ListAssignments,
            createFunction: Promotions.SaveAssignment
        },
        createPriority: 6,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "PromotionID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Promotions,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
            },
        ]
    },
    [OCResourceEnum.ProductSupplierAssignments]: {
        openApiSpec: {
            schemaName: "ProductSupplier",
            resourceCreatePath: "/products/{productID}/suppliers/{supplierID}",
            listFunction: Products.ListSuppliers,
            createFunction: Products.SaveSupplier
        },
        routeParams: ["ProductID", "SupplierID"],
        createPriority: 5,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "ProductID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "SupplierID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "DefaultPriceScheduleID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.PriceSchedules,
            },
        ],
        downloadTransformFunc: (x) => { 
            return { SupplierID: x.ID, DefaultPriceScheduleID: x.DefaultPriceScheduleID };
        }
    },
    [OCResourceEnum.SupplierBuyerAssignments]: {
        openApiSpec: {
            schemaName: "SupplierBuyer",
            resourceCreatePath: "/suppliers/{supplierID}/buyers/{buyerID}",
            listFunction: Suppliers.ListBuyers,
            createFunction: Suppliers.SaveBuyer
        },
        createPriority: 5,
        routeParams: ["SupplierID", "BuyerID"],
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldNameOnThisResource: "SupplierID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            }
        ],
        downloadTransformFunc: (x) => { 
            return { BuyerID: x.ID };
        }
    },
};

export class OCResourceDirectory {
    private resources: OCResourcesMetaData;

    public constructor(resources: OCResourcesMetaData) {
        this.resources = resources;
    }

    listResourceNames(): OCResourceEnum[] {
        return Object.keys(this.resources) as OCResourceEnum[];
    }

    listResourceMetadata(): OCResourceMetadata[] {
        return Object.values(this.resources);
    } 

    getResourceMetaData(name: OCResourceEnum): OCResourceMetadata {
        let metaData = this.resources[name];
        if (!metaData) {
            throw "Resource name " + name + " not found";
        }
        return metaData;
    }

    listResourceRelationships(name: OCResourceEnum): ResourceReference[] {
        let metaData = this.getResourceMetaData(name);
        return metaData.outgoingResourceReferences;
    }
}

export async function BuildOCResourceDirectory(): Promise<OCResourceDirectory> {
    var openAPISpec = await axios.get(`https://api.ordercloud.io/v1/openapi/v3`) 
    var dir = Object.entries(ocResourceMetaDataHardCoded).map([name, metaData] => {  

        return new OCResourceMetadata(name, metaData, openAPISpec, null, []);
    });
    return new OCResourceDirectory(dir);
}

