import axios from "axios";
import { Addresses, AdminAddresses, InventoryRecords, AdminUserGroups, AdminUsers, ApiClients, ApprovalRules, Buyers, Catalogs, Categories, CostCenters, CreditCards, ImpersonationConfigs, Incrementors, IntegrationEvents, Locales, MessageSenders, OpenIdConnects, PriceSchedules, ProductFacets, Products, Promotions, SecurityProfiles, Specs, SpendingAccounts, SupplierAddresses, Suppliers, SupplierUserGroups, SupplierUsers, UserGroups, Users, Webhooks, XpIndices, SellerApprovalRules } from "ordercloud-javascript-sdk";
import { OCResourceEnum } from "./oc-resource-enum";
import { OCResource, ResourceReference, ResourceReferenceType } from "./oc-resources";
import _ from 'lodash';
import { ApiClientValidationFunc, ImpersonationConfigValidationFunc, InventoryRecordValidationFunc, LocaleAssignmentValidationFunc, ProductAssignmentValidationFunc, ProductValidationFunc, RecordValidationFunc, SecurityProfileAssignmentValidationFunc, SellerApprovalRuleValidationFunc, VariantInventoryRecordValidationFunc, VariantValidationFunc, WebhookValidationFunc } from "../services/custom-validation-func";
import { OpenAPIProperties } from "./open-api";

// Hard coded in the directory to match records with the Open API Spec
interface OpenAPIDirectoryEntry {
    schemaName: string; // matches open api spec model for POST
    listFunction: Function;
    createFunction: Function;
    resourcePath: string;
    schemaAllProperties?: OpenAPIProperties; // used to validate field types
    createOperationRequiredProperties?: string[]; // used to validate required fields
}

export interface OCResourceDirectoryEntry {
    name: OCResourceEnum;
    openApiSpec: OpenAPIDirectoryEntry;
    isAssignment: boolean;
    routeParams?: string[];
    createPriority: number; // higher numbers need to be created first
    outgoingResourceReferences?: ResourceReference[];
    //incommingResourceReferences?: ResourceReference[];
    redactFields?: string[];
    downloadTransformFunc?: (x: any) => any,
    customValidationFunc?: RecordValidationFunc,
    shouldAttemptListFunc?: (parentRecord: any) => boolean
}

const Directory: OCResourceDirectoryEntry[] = [
    { 
        name: OCResourceEnum.SecurityProfiles,
        openApiSpec: {
            schemaName: 'SecurityProfile',
            resourcePath: "/securityprofiles",
            listFunction: SecurityProfiles.List,
            createFunction: SecurityProfiles.Create
        }, 
        createPriority: 2,
        isAssignment: false,
    },
    { 
        name: OCResourceEnum.ImpersonationConfigs,
        openApiSpec: {
            schemaName: 'ImpersonationConfig',
            resourcePath: "/impersonationconfig",
            listFunction: ImpersonationConfigs.List,
            createFunction: ImpersonationConfigs.Create
        }, 
        createPriority: 7,
        isAssignment: false,
        customValidationFunc: ImpersonationConfigValidationFunc,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "ClientID",
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.ApiClients,  
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "SecurityProfileID", 
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.SecurityProfiles,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "BuyerID", 
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.Buyers, 
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "GroupID",
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.UserGroups,
                foreignParentRefField: "BuyerID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,  
                fieldNameOnThisResource: "UserID",
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.Users,
                foreignParentRefField: "BuyerID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal, 
                fieldNameOnThisResource: "ImpersonationBuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
        ]
    },
    {
        name: OCResourceEnum.OpenIdConnects,
        openApiSpec: {
            schemaName: 'OpenIdConnect',
            resourcePath: "/openidconnects",
            listFunction: OpenIdConnects.List,
            createFunction: OpenIdConnects.Create
        }, 
        createPriority: 7,
        isAssignment: false,
        redactFields: ["ConnectClientSecret"],
        outgoingResourceReferences: 
        [
            { 
                referenceType: ResourceReferenceType.Horizontal,  
                fieldNameOnThisResource: "OrderCloudApiClientID",
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.ApiClients,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal, 
                fieldNameOnThisResource: "IntegrationEventID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.IntegrationEvents,
            }
        ]
    },
    {
        name: OCResourceEnum.AdminUsers,
        openApiSpec: {
            schemaName: 'UserGroup',
            resourcePath: "/adminusers",
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
    {
        name: OCResourceEnum.AdminUserGroups,
        openApiSpec: {
            schemaName: 'UserGroup',
            resourcePath: "/usergroups",
            listFunction: AdminUserGroups.List,
            createFunction: AdminUserGroups.Create
        },  
        createPriority: 2,
        isAssignment: false,
    },
    {
        name: OCResourceEnum.AdminAddresses, 
        openApiSpec: {
            schemaName: 'Address',
            resourcePath: "/addresses",
            listFunction: AdminAddresses.List,
            createFunction: AdminAddresses.Create
        }, 
        createPriority: 2,
        isAssignment: false,
    },
    {
        name: OCResourceEnum.MessageSenders,  
        openApiSpec: {
            schemaName: 'MessageSender',
            resourcePath: "/messagesenders",
            listFunction: MessageSenders.List,
            createFunction: MessageSenders.Create
        }, 
        createPriority: 2,
        isAssignment: false,
        redactFields: ["SharedKey"],
    },
    {
        name: OCResourceEnum.ApiClients,
        openApiSpec: {
            schemaName: 'ApiClient',
            resourcePath: "/apiclients",
            listFunction: ApiClients.List,
            createFunction: ApiClients.Create
        }, 
        createPriority: 6,
        isAssignment: false,
        redactFields: ["ClientSecret"],
        outgoingResourceReferences:
        [
            { 
                referenceType: ResourceReferenceType.Horizontal,  
                fieldNameOnThisResource: "OrderCheckoutIntegrationEventID",
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.IntegrationEvents,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal, 
                fieldNameOnThisResource: "OrderReturnIntegrationEventID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.IntegrationEvents,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal, 
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
    {
        name: OCResourceEnum.Locales,
        openApiSpec: {
            schemaName: 'Locale',
            resourcePath: "/locales",
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
    {
        name: OCResourceEnum.Incrementors,
        openApiSpec: {
            schemaName: 'Incrementor',
            resourcePath: "/incrementors",
            listFunction: Incrementors.List,
            createFunction: Incrementors.Create
        }, 
        createPriority: 1,
        isAssignment: false,
    },
    {
        name: OCResourceEnum.Webhooks, 
        openApiSpec: {
            schemaName: "Webhook",
            resourcePath: "/webhooks",
            listFunction: Webhooks.List,
            createFunction: Webhooks.Create
        }, 
        createPriority: 7,
        isAssignment: false,
        redactFields: ["HashKey"],
        // for .ApiClientIDs
        customValidationFunc: WebhookValidationFunc
    },
    {
        name: OCResourceEnum.IntegrationEvents,
        openApiSpec: {
            schemaName: "IntegrationEvent",
            resourcePath: "/integrationEvents",
            listFunction: IntegrationEvents.List,
            createFunction: IntegrationEvents.Create
        },  
        createPriority: 2,
        isAssignment: false,
        redactFields: ["HashKey"],
    },
    {
        name: OCResourceEnum.XpIndices, 
        openApiSpec: {
            schemaName: "XpIndex",
            resourcePath: "/xpindices",
            listFunction: XpIndices.List,
            createFunction: XpIndices.Put
        }, 
        createPriority: 1,
        isAssignment: false,
    },
    {
        name: OCResourceEnum.Buyers, 
        openApiSpec: {
            schemaName: "User",
            resourcePath: "/buyers",
            listFunction: Buyers.List,
            createFunction: Buyers.Create
        }, 
        createPriority: 4,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Horizontal, 
                fieldNameOnThisResource: "DefaultCatalogID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Catalogs,
            }
        ]
    },
    {
        name: OCResourceEnum.Users, 
        openApiSpec: {
            schemaName: "User",
            resourcePath: "/buyers/{buyerID}/users",
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
    {
        name: OCResourceEnum.UserGroups,
        openApiSpec: {
            schemaName: "UserGroup",
            resourcePath: "/buyers/{buyerID}/usergroups",
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
    {
        name: OCResourceEnum.Addresses,
        openApiSpec: {
            schemaName: "Address",
            resourcePath: "/buyers/{buyerID}/addresses",
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
    {
        name: OCResourceEnum.CostCenters,
        openApiSpec: {
            schemaName: "CostCenter",
            resourcePath: "/buyers/{buyerID}/costcenters",
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
    {
        name: OCResourceEnum.CreditCards,
        openApiSpec: {
            schemaName: "CreditCard",
            resourcePath: "/buyers/{buyerID}/creditcards",
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
    {
        name: OCResourceEnum.SpendingAccounts,
        openApiSpec: {
            schemaName: "SpendingAccount",
            resourcePath: "/buyers/{buyerID}/spendingaccounts",
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
    {
        name: OCResourceEnum.ApprovalRules,
        openApiSpec: {
            schemaName: "ApprovalRule",
            resourcePath: "/buyers/{buyerID}/approvalrules",
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
                referenceType: ResourceReferenceType.Horizontal,
                foreignParentRefField: "BuyerID",
            }
        ]
    },
    {
        name: OCResourceEnum.Catalogs,
        openApiSpec: {
            schemaName: "Catalog",
            resourcePath: "/catalogs",
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
    {
        name: OCResourceEnum.Categories,
        openApiSpec: {
            schemaName: "Category",
            resourcePath: "/catalogs/{catalogID}/categories",
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
                referenceType: ResourceReferenceType.Horizontal,
                foreignParentRefField: "CatalogID", 
            }
        ]
    },
    {
        name: OCResourceEnum.Suppliers, 
        openApiSpec: {
            schemaName: "Supplier",
            resourcePath: "/suppliers",
            listFunction: Suppliers.List,
            createFunction: Suppliers.Create
        },
        createPriority: 2,
        isAssignment: false,
    },
    {
        name: OCResourceEnum.SupplierUsers, 
        openApiSpec: {
            schemaName: "User",
            resourcePath: "/suppliers/{supplierID}/users",
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
    {
        name: OCResourceEnum.SupplierUserGroups, 
        openApiSpec: {
            schemaName: "UserGroup",
            resourcePath: "/suppliers/{supplierID}/usergroups",
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
    {
        name: OCResourceEnum.SupplierAddresses,
        openApiSpec: {
            schemaName: "Address",
            resourcePath: "/suppliers/{supplierID}/addresses",
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
    {
        name: OCResourceEnum.Products, 
        openApiSpec: {
            schemaName: "Product",
            resourcePath: "/products",
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
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "DefaultPriceScheduleID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.PriceSchedules,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "DefaultSupplierID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ],
        customValidationFunc: ProductValidationFunc
    },
    {
        name: OCResourceEnum.PriceSchedules,
        openApiSpec: {
            schemaName: "PriceSchedule",
            resourcePath: "/priceschedules",
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
    {
        name: OCResourceEnum.Specs, 
        openApiSpec: {
            schemaName: "Spec",
            resourcePath: "/specs",
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
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "DefaultOptionID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SpecOptions,
                foreignParentRefField: "ID" // should this be "SpecID"?
            },
        ],
    },
    {
        name: OCResourceEnum.SpecOptions, 
        openApiSpec: {
            schemaName: "SpecOption",
            resourcePath: "/specs/{specID}/options",
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
    {
        name: OCResourceEnum.ProductFacets,
        openApiSpec: {
            schemaName: "ProductFacet",
            resourcePath: "/productfacets",
            listFunction: ProductFacets.List,
            createFunction: ProductFacets.Create
        }, 
        createPriority: 2,
        isAssignment: false,
    },
    {
        name: OCResourceEnum.Promotions, 
        openApiSpec: {
            schemaName: "Promotion",
            resourcePath: "/promotions",
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
    {
        name: OCResourceEnum.Variants,
        openApiSpec: {
            schemaName: "Variant",
            resourcePath: "/products/{productID}/variants",
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
    {
        name: OCResourceEnum.InventoryRecords, 
        openApiSpec: {
            schemaName: "InventoryRecord",
            resourcePath: "/products/{productID}/inventoryrecords",
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
    {
        name: OCResourceEnum.VariantInventoryRecords, 
        openApiSpec: {
            schemaName: "InventoryRecord",
            resourcePath: "/products/{productID}/variants/{variantID}/inventoryrecords",
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
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "VariantID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Variants,
                foreignParentRefField: "ProductID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "ProductID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
        ],
        customValidationFunc: VariantInventoryRecordValidationFunc,
    },
    {
        name: OCResourceEnum.SellerApprovalRules,
        openApiSpec: {
            schemaName: "SellerApprovalRule",
            resourcePath: "/approvalrules",
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
    {
        name: OCResourceEnum.SecurityProfileAssignments, 
        openApiSpec: {
            schemaName: "SecurityProfileAssignment",
            resourcePath: "/securityprofiles/assignments",
            listFunction: SecurityProfiles.ListAssignments,
            createFunction: SecurityProfiles.SaveAssignment
        },
        createPriority: 6,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "SecurityProfileID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SecurityProfiles,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "SupplierID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ], 
        customValidationFunc: SecurityProfileAssignmentValidationFunc
    },
    {
        name: OCResourceEnum.AdminUserGroupAssignments, 
        openApiSpec: {
            schemaName: "UserGroupAssignment",
            resourcePath: "/usergroups/assignments",
            listFunction: AdminUserGroups.ListUserAssignments,
            createFunction: AdminUserGroups.SaveUserAssignment
        },
        createPriority: 3,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "UserID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.AdminUsers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.AdminUserGroups,
            },
        ]
    },
    {
        name: OCResourceEnum.ApiClientAssignments, 
        openApiSpec: {
            schemaName: "ApiClientAssignment",
            resourcePath: "/apiclients/assignments",
            listFunction: ApiClients.SaveAssignment,
            createFunction: ApiClients.ListAssignments
        },
        createPriority: 7,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "ApiClientID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.ApiClients,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
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
    {
        name: OCResourceEnum.LocaleAssignments, 
        openApiSpec: {
            schemaName: "LocaleAssignment",
            resourcePath: "/locales/assignments",
            listFunction: Locales.SaveAssignment,
            createFunction: Locales.ListAssignments
        },
        createPriority: 6,
        isAssignment: true,
        customValidationFunc: LocaleAssignmentValidationFunc,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "LocaleID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Locales,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Users,
                foreignParentRefField: "BuyerID",
            },
        ],
    },
    {
        name: OCResourceEnum.UserGroupAssignments, 
        openApiSpec: {
            schemaName: "UserGroupAssignment",
            resourcePath: "/buyers/{buyerID}/usergroups/assignments",
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
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "UserID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Users,
                foreignParentRefField: "BuyerID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
                foreignParentRefField: "BuyerID",
            },
        ],           
    },
    {
        name: OCResourceEnum.AddressAssignments, 
        openApiSpec: {
            schemaName: "AddressAssignment",
            resourcePath: "/buyers/{buyerID}/addresses/assignments",
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
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "AddressID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Addresses,
                foreignParentRefField: "BuyerID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "UserID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Users,
                foreignParentRefField: "BuyerID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
                foreignParentRefField: "BuyerID",
            },
        ],
    },
    {
        name: OCResourceEnum.CostCenterAssignments, 
        openApiSpec: {
            schemaName: "CostCenterAssignment",
            resourcePath: "/buyers/{buyerID}/costcenters",
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
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "CostCenterID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.CostCenters,
                foreignParentRefField: "BuyerID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
                foreignParentRefField: "BuyerID",
            },
        ],       
    },
    {
        name: OCResourceEnum.CreditCardAssignments, 
        openApiSpec: {
            schemaName: "CreditCardAssignment",
            resourcePath: "/buyers/{buyerID}/creditcards/assignments",
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
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "CreditCardID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.CreditCards,
                foreignParentRefField: "BuyerID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "UserID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Users,
                foreignParentRefField: "BuyerID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
                foreignParentRefField: "BuyerID",
            },
        ],
    },
    {
        name: OCResourceEnum.SpendingAccountAssignments, 
        openApiSpec: {
            schemaName: "SpendingAccountAssignment",
            resourcePath: "/buyers/{buyerID}/spendingaccounts/assignments",
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
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "SpendingAccountID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SpendingAccounts,
                foreignParentRefField: "BuyerID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "UserID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Users,
                foreignParentRefField: "BuyerID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
                foreignParentRefField: "BuyerID",
            },
        ],   
    },
    {
        name: OCResourceEnum.SupplierUserGroupsAssignments, 
        openApiSpec: {
            schemaName: "UserGroupAssignment",
            resourcePath: "/suppliers/{supplierID}/usergroups/assignments",
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
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "UserID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SupplierUsers,
                foreignParentRefField: "SupplierID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SupplierUserGroups,
                foreignParentRefField: "SupplierID",
            },
        ],           
    },
    {
        name: OCResourceEnum.ProductAssignments, 
        openApiSpec: {
            schemaName: "ProductAssignment",
            resourcePath: "/products/assignments",
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
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "ProductID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "PriceScheduleID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.PriceSchedules,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
                foreignParentRefField: "BuyerID",
            },
        ],         
    },
    {
        name: OCResourceEnum.CatalogAssignments,
        openApiSpec: {
            schemaName: "CatalogAssignment",
            resourcePath: "/catalogs/assignments",
            listFunction: Catalogs.ListAssignments,
            createFunction: Catalogs.SaveAssignment
        },
        createPriority: 5,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "CatalogID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Catalogs,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
        ]           
    },
    {
        name: OCResourceEnum.ProductCatalogAssignment, 
        openApiSpec: {
            schemaName: "ProductCatalogAssignment",
            resourcePath: "/catalogs/productassignments",
            listFunction: Catalogs.ListProductAssignments,
            createFunction: Catalogs.SaveProductAssignment
        },
        createPriority: 5,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "CatalogID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Catalogs,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "ProductID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
        ]                   
    },
    {
        name: OCResourceEnum.CategoryAssignments, 
        openApiSpec: {
            schemaName: "CategoryAssignment",
            resourcePath: "/catalogs/{catalogID}/categories/assignments",
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
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "CategoryID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Categories,
                foreignParentRefField: "CatalogID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
                foreignParentRefField: "BuyerID",
            },
        ]           
    },
    {
        name: OCResourceEnum.CategoryProductAssignments, 
        openApiSpec: {
            schemaName: "CategoryProductAssignment",
            resourcePath: "/catalogs/{catalogID}/categories/productassignments",
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
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "CategoryID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Categories,
                foreignParentRefField: "CatalogID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "ProductID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
        ]           
    },
    {
        name: OCResourceEnum.SpecProductAssignments, 
        openApiSpec: {
            schemaName: "SpecProductAssignment",
            resourcePath: "/specs/productassignments",
            listFunction: Specs.ListProductAssignments,
            createFunction: Specs.SaveProductAssignment
        },
        createPriority: 5,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "SpecID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Specs,
                foreignParentRefField: "CatalogID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "ProductID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "DefaultOptionID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SpecOptions,
                foreignParentRefField: "SpecID",
            },
        ]
    },
    {
        name: OCResourceEnum.PromotionAssignments, 
        openApiSpec: {
            schemaName: "PromotionAssignment",
            resourcePath: "/promotions/assignments",
            listFunction: Promotions.ListAssignments,
            createFunction: Promotions.SaveAssignment
        },
        createPriority: 6,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "PromotionID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Promotions,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
                foreignParentRefField: "BuyerID",
            },
        ]
    },
    {
        name: OCResourceEnum.ProductSupplierAssignments, 
        openApiSpec: {
            schemaName: "ProductSupplier",
            resourcePath: "/products/{productID}/suppliers/{supplierID}",
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
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "SupplierID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "DefaultPriceScheduleID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.PriceSchedules,
            },
        ],
        downloadTransformFunc: (x) => { 
            return { SupplierID: x.ID, DefaultPriceScheduleID: x.DefaultPriceScheduleID };
        }
    },
    {
        name: OCResourceEnum.SupplierBuyerAssignments,
        openApiSpec: {
            schemaName: "SupplierBuyer",
            resourcePath: "/suppliers/{supplierID}/buyers/{buyerID}",
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
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldNameOnThisResource: "SupplierID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            }
        ],
        downloadTransformFunc: (x) => { 
            return { BuyerID: x.ID };
        }
    },
];


export async function BuildOCResourceDirectory(): Promise<OCResource[]> {
    var openAPISpec = await axios.get(`https://api.ordercloud.io/v1/openapi/v3`) 
    return Directory.map(resource => {  

        return new OCResource(resource, openAPISpec, null, []);
    });
}

