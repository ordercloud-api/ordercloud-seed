import axios from "axios";
import { Addresses, AdminAddresses, InventoryRecords, AdminUserGroups, AdminUsers, ApiClients, ApprovalRules, Buyers, Catalogs, Categories, CostCenters, CreditCards, ImpersonationConfigs, Incrementors, IntegrationEvents, Locales, MessageSenders, OpenIdConnects, PriceSchedules, ProductFacets, Products, Promotions, SecurityProfiles, Specs, SpendingAccounts, SupplierAddresses, Suppliers, SupplierUserGroups, SupplierUsers, UserGroups, Users, Webhooks, XpIndices, SellerApprovalRules } from "ordercloud-javascript-sdk";
import { OCResourceEnum } from "./oc-resource-enum";
import { OCResource, ResourceReferenceType } from "./oc-resources";
import _ from 'lodash';
import { ApiClientValidationFunc, ImpersonationConfigValidationFunc, InventoryRecordValidationFunc, LocaleAssignmentCustomValidationFunc, ProductAssignmentValidationFunc, ProductValidationFunc, SecurityProfileAssignmentValidationFunc, SellerApprovalRuleValidationFunc, VariantInventoryRecordValidationFunc, VariantValidationFunc, WebhookValidationFunc } from "../services/custom-validation-func";

const Directory: OCResource[] = [
    { 
        name: OCResourceEnum.SecurityProfiles,
        openApiSchemaName: 'SecurityProfile',
        sdkObject: SecurityProfiles,
        createPriority: 2,
        isAssignment: false,
        isChild: false,
        isParent: false,
        isSellerOwned: false,
        openApiCreatePath: "/securityprofiles"
    },
    { 
        name: OCResourceEnum.ImpersonationConfigs,
        openApiSchemaName: 'ImpersonationConfig',
        sdkObject: ImpersonationConfigs,
        createPriority: 7,
        isAssignment: false,
        isChild: false,
        isParent: false,
        isSellerOwned: false,
        openApiCreatePath: "/impersonationconfig",
        customValidationFunc: ImpersonationConfigValidationFunc,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "ClientID",
                fieldOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.ApiClients,  
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "SecurityProfileID", 
                fieldOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.SecurityProfiles,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "BuyerID", 
                fieldOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.Buyers, 
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "GroupID",
                fieldOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.UserGroups,
                foreignParentRefField: "BuyerID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,  
                fieldOnThisResource: "UserID",
                fieldOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.Users,
                foreignParentRefField: "BuyerID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal, 
                fieldOnThisResource: "ImpersonationBuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
        ]
    },
    {
        name: OCResourceEnum.OpenIdConnects,
        openApiSchemaName: 'OpenIdConnect',
        sdkObject: OpenIdConnects,
        createPriority: 7,
        isAssignment: false,
        isChild: false,
        isParent: false,
        isSellerOwned: false,
        openApiCreatePath: "/openidconnects",
        redactFields: ["ConnectClientSecret"],
        outgoingResourceReferences: 
        [
            { 
                referenceType: ResourceReferenceType.Horizontal,  
                fieldOnThisResource: "OrderCloudApiClientID",
                fieldOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.ApiClients,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal, 
                fieldOnThisResource: "IntegrationEventID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.IntegrationEvents,
            }
        ]
    },
    {
        name: OCResourceEnum.AdminUsers,
        openApiSchemaName: 'User',
        sdkObject: AdminUsers,
        openApiCreatePath: "/adminusers",
        createPriority: 2,
        isAssignment: false,
        isChild: false,
        isParent: false,
        isSellerOwned: false,
        downloadTransformFunc: (x) => { 
            delete x.Locale;
            delete x.CompanyID; // this is always a reference to the marketplace ID. 
            return x;
        }
    },
    {
        name: OCResourceEnum.AdminUserGroups, 
        openApiSchemaName: 'UserGroup',
        sdkObject: AdminUserGroups,
        openApiCreatePath: "/usergroups",
        createPriority: 2,
        isAssignment: false,
        isChild: false,
        isParent: false,
        isSellerOwned: false,
    },
    {
        name: OCResourceEnum.AdminAddresses, 
        openApiSchemaName: 'Address',
        sdkObject: AdminAddresses,
        openApiCreatePath: "/addresses",
        createPriority: 2,
        isAssignment: false,
        isChild: false,
        isParent: false,
        isSellerOwned: false,
    },
    {
        name: OCResourceEnum.MessageSenders,  
        openApiSchemaName: 'MessageSender',
        sdkObject: MessageSenders,
        openApiCreatePath: "/messagesenders",
        createPriority: 2,
        isAssignment: false,
        isChild: false,
        isParent: false,
        isSellerOwned: false,
        redactFields: ["SharedKey"],
    },
    {
        name: OCResourceEnum.ApiClients, 
        openApiSchemaName: 'ApiClient',
        sdkObject: ApiClients,
        createPriority: 6,
        isAssignment: false,
        isChild: false,
        isParent: false,
        isSellerOwned: false,
        openApiCreatePath: "/apiclients",
        redactFields: ["ClientSecret"],
        outgoingResourceReferences:
        [
            { 
                referenceType: ResourceReferenceType.Horizontal,  
                fieldOnThisResource: "OrderCheckoutIntegrationEventID",
                fieldOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.IntegrationEvents,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal, 
                fieldOnThisResource: "OrderReturnIntegrationEventID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.IntegrationEvents,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal, 
                fieldOnThisResource: "AddToCartIntegrationEventID",
                fieldOnOtherReasource: "ID", 
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
        openApiSchemaName: 'Locale',
        sdkObject: Locales,
        openApiCreatePath: "/locales",
        createPriority: 3,
        isAssignment: false,
        isChild: false,
        isParent: false,
        isSellerOwned: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Owner,
                fieldOnThisResource: "OwnerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ],
    },
    {
        name: OCResourceEnum.Incrementors,
        openApiSchemaName: 'Incrementor',
        sdkObject: Incrementors,
        openApiCreatePath: "/incrementors",
        createPriority: 1,
        isAssignment: false,
        isChild: false,
        isParent: false,
        isSellerOwned: false,
    },
    {
        name: OCResourceEnum.Webhooks, 
        openApiSchemaName: 'Webhook',
        sdkObject: Webhooks,
        createPriority: 7,
        isAssignment: false,
        isChild: false,
        isParent: false,
        isSellerOwned: false,
        openApiCreatePath: "/webhooks",
        redactFields: ["HashKey"],
        // for .ApiClientIDs
        customValidationFunc: WebhookValidationFunc
    },
    {
        name: OCResourceEnum.IntegrationEvents, 
        openApiSchemaName: 'IntegrationEvent',
        sdkObject: IntegrationEvents,
        openApiCreatePath: "/integrationEvents",
        createPriority: 2,
        isAssignment: false,
        isChild: false,
        isParent: false,
        isSellerOwned: false,
        redactFields: ["HashKey"],
    },
    {
        name: OCResourceEnum.XpIndices, 
        openApiSchemaName: "XpIndex",
        sdkObject: XpIndices,
        openApiCreatePath: "/xpindices",
        createPriority: 1,
        isAssignment: false,
        isChild: false,
        isParent: false,
        isSellerOwned: false,
        openApiCreateOperation: "Put"
    },
    {
        name: OCResourceEnum.Buyers, 
        openApiSchemaName: "Buyer",
        sdkObject: Buyers,
        createPriority: 4,
        isAssignment: false,
        isChild: false,
        isParent: true,
        isSellerOwned: false,
        openApiCreatePath: "/buyers",
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Horizontal, 
                fieldOnThisResource: "DefaultCatalogID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Catalogs,
            }
        ],
        children: [OCResourceEnum.Users, OCResourceEnum.UserGroups, OCResourceEnum.Addresses, OCResourceEnum.CostCenters, OCResourceEnum.CreditCards, OCResourceEnum.SpendingAccounts, OCResourceEnum.ApprovalRules, OCResourceEnum.UserGroupAssignments, OCResourceEnum.SpendingAccountAssignments, OCResourceEnum.AddressAssignments, OCResourceEnum.CostCenterAssignments, OCResourceEnum.CreditCardAssignments],
    },
    {
        name: OCResourceEnum.Users, 
        openApiSchemaName: "User",
        sdkObject: Users,
        createPriority: 5,
        isAssignment: false,
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "BuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
        ],
        openApiCreatePath: "/buyers/{buyerID}/users",
        downloadTransformFunc: (x) => { 
            delete x.Locale;
            return x;
        }
    },
    {
        name: OCResourceEnum.UserGroups,
        openApiSchemaName: "UserGroup",
        sdkObject: UserGroups,
        createPriority: 5,
        isAssignment: false,
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "BuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
        ],
        openApiCreatePath: "/buyers/{buyerID}/usergroups",
    },
    {
        name: OCResourceEnum.Addresses,
        openApiSchemaName: "Address",
        sdkObject: Addresses,
        createPriority: 5,
        isAssignment: false,
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "BuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
        ],
        openApiCreatePath: "/buyers/{buyerID}/addresses",
    },
    {
        name: OCResourceEnum.CostCenters,
        openApiSchemaName: "CostCenter",
        sdkObject: CostCenters,
        createPriority: 5,
        isAssignment: false,
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "BuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
        ],
        openApiCreatePath: "/buyers/{buyerID}/costcenters",
    },
    {
        name: OCResourceEnum.CreditCards,
        openApiSchemaName: "CreditCard",
        sdkObject: CreditCards,
        createPriority: 5,
        isAssignment: false,
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "BuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
        ],
        openApiCreatePath: "/buyers/{buyerID}/creditcards",
    },
    {
        name: OCResourceEnum.SpendingAccounts,
        openApiSchemaName: "SpendingAccount",
        sdkObject: SpendingAccounts,
        createPriority: 5,
        isAssignment: false,
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "BuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
        ],
        openApiCreatePath: "/buyers/{buyerID}/spendingaccounts",
    },
    {
        name: OCResourceEnum.ApprovalRules,
        openApiSchemaName:"ApprovalRule",
        sdkObject: ApprovalRules,
        createPriority: 6,
        isAssignment: false,
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        openApiCreatePath: "/buyers/{buyerID}/approvalrules",
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "BuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                fieldOnThisResource: "ApprovingGroupID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
                referenceType: ResourceReferenceType.Horizontal,
                foreignParentRefField: "BuyerID",
            }
        ]
    },
    {
        name: OCResourceEnum.Catalogs, 
        openApiSchemaName: "Catalog",
        sdkObject: Catalogs,
        createPriority: 3,
        isAssignment: false,
        isChild: false,
        isParent: true,
        openApiCreatePath: "/catalogs",
        isSellerOwned: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Owner,
                fieldOnThisResource: "OwnerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ],
        children: [OCResourceEnum.Categories, OCResourceEnum.CategoryAssignments, OCResourceEnum.CategoryProductAssignments]
    },
    {
        name: OCResourceEnum.Categories,
        openApiSchemaName: "Category",
        sdkObject: Categories,
        createPriority: 4,
        isAssignment: false,
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        openApiCreatePath: "/catalogs/{catalogID}/categories",
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "CatalogID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Catalogs,
            },
            { 
                fieldOnThisResource: "CatalogID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Categories,
                referenceType: ResourceReferenceType.Horizontal,
                foreignParentRefField: "CatalogID", 
            }
        ]
    },
    {
        name: OCResourceEnum.Suppliers, 
        openApiSchemaName: "Supplier",
        sdkObject: Suppliers,
        createPriority: 2,
        isAssignment: false,
        isChild: false,
        isParent: true,
        isSellerOwned: false,
        openApiCreatePath: "/suppliers",
        children: [OCResourceEnum.SupplierUsers, OCResourceEnum.SupplierUserGroups, OCResourceEnum.SupplierAddresses, OCResourceEnum.SupplierUserGroupsAssignments, OCResourceEnum.SupplierBuyerAssignments]
    },
    {
        name: OCResourceEnum.SupplierUsers, 
        openApiSchemaName: "User",
        sdkObject: SupplierUsers,
        createPriority: 3,
        isAssignment: false,
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "SupplierID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ],
        openApiCreatePath: "/suppliers/{supplierID}/users",
        downloadTransformFunc: (x) => { 
            delete x.Locale;
            return x;
        }
    },
    {
        name: OCResourceEnum.SupplierUserGroups, 
        openApiSchemaName: "UserGroup",
        sdkObject: SupplierUserGroups,
        createPriority: 3,
        isAssignment: false,
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "SupplierID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ],
        openApiCreatePath: "/suppliers/{supplierID}/usergroups",
    },
    {
        name: OCResourceEnum.SupplierAddresses,
        openApiSchemaName: "Address",
        sdkObject: SupplierAddresses,
        createPriority: 3,
        isAssignment: false,
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "SupplierID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ],
        openApiCreatePath: "/suppliers/{supplierID}/addresses",
    },
    {
        name: OCResourceEnum.Products, 
        openApiSchemaName: "Product",
        sdkObject: Products,
        createPriority: 4,
        isAssignment: false,
        isChild: false,
        isParent: true,
        isSellerOwned: true,
        openApiCreatePath: "/products",
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Owner,
                fieldOnThisResource: "OwnerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "DefaultPriceScheduleID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.PriceSchedules,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "DefaultSupplierID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ],
        children: [OCResourceEnum.ProductSupplierAssignments, OCResourceEnum.Variants, OCResourceEnum.InventoryRecords],
        customValidationFunc: ProductValidationFunc
    },
    {
        name: OCResourceEnum.PriceSchedules, 
        openApiSchemaName: "PriceSchedule",
        sdkObject: PriceSchedules,
        openApiCreatePath: "/priceschedules",
        createPriority: 3,
        isAssignment: false,
        isChild: false,
        isParent: false,
        isSellerOwned: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Owner,
                fieldOnThisResource: "OwnerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ]
    },
    {
        name: OCResourceEnum.Specs, 
        openApiSchemaName: "Spec",
        sdkObject: Specs,
        createPriority: 3,
        isAssignment: false,
        isChild: false,
        isParent: true,
        openApiCreatePath: "/specs",
        isSellerOwned: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Owner,
                fieldOnThisResource: "OwnerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "DefaultOptionID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SpecOptions,
                foreignParentRefField: "ID" // should this be "SpecID"?
            },
        ],
        children: [OCResourceEnum.SpecOptions]
    },
    {
        name: OCResourceEnum.SpecOptions, 
        openApiSchemaName: "SpecOption",
        sdkObject: Specs,
        createPriority: 4,
        isAssignment: false,
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        openApiCreatePath: "/specs/{specID}/options",
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "SpecID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Specs,
            },
        ],
        openApiListOperation: "ListOptions",
        openApiCreateOperation: "CreateOption",
    },
    {
        name: OCResourceEnum.ProductFacets,
        openApiSchemaName: "ProductFacet",
        sdkObject: ProductFacets,
        openApiCreatePath: "/productfacets",
        createPriority: 2,
        isAssignment: false,
        isChild: false,
        isParent: false,
        isSellerOwned: false
    },
    {
        name: OCResourceEnum.Promotions, 
        openApiSchemaName: "Promotion",
        sdkObject: Promotions,
        openApiCreatePath: "/promotions",
        createPriority: 3,
        isAssignment: false,
        isChild: false,
        isParent: false,
        isSellerOwned: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Owner,
                fieldOnThisResource: "OwnerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ],
    },
    {
        name: OCResourceEnum.Variants, 
        openApiSchemaName: "Variant",
        sdkObject: Products,
        createPriority: 6,
        isAssignment: false,
        isChild: true,
        isParent: true,
        isSellerOwned: false,
        openApiCreatePath: "/products/{productID}/variants",
        openApiListOperation: 'ListVariants',
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "ProductID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
        ],
        children: [OCResourceEnum.VariantInventoryRecords],
        customValidationFunc: VariantValidationFunc,
        shouldAttemptListFunc: (product) => (product?.VariantCount > 0)
    },
    {
        name: OCResourceEnum.InventoryRecords, 
        openApiSchemaName: "InventoryRecord",
        sdkObject: InventoryRecords,
        createPriority: 5,
        isAssignment: false,
        isChild: true,
        isParent: false,
        openApiCreatePath: "/products/{productID}/inventoryrecords",
        isSellerOwned: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "ProductID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
            { 
                referenceType: ResourceReferenceType.Owner,
                fieldOnThisResource: "OwnerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ],
        customValidationFunc: InventoryRecordValidationFunc,
    },
    {
        name: OCResourceEnum.VariantInventoryRecords, 
        openApiSchemaName: "InventoryRecord",
        sdkObject: InventoryRecords,
        createPriority: 7,
        isAssignment: false,
        isChild: true,
        isParent: false,
        openApiCreatePath: "/products/{productID}/variants/{variantID}/inventoryrecords",
        secondRouteParam: "VariantID",
        openApiListOperation: 'ListVariant',
        openApiCreateOperation: 'CreateVariant',
        isSellerOwned: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "ProductID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
            { 
                referenceType: ResourceReferenceType.Owner,
                fieldOnThisResource: "OwnerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "VariantID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Variants,
                foreignParentRefField: "ProductID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "ProductID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
        ],
        customValidationFunc: VariantInventoryRecordValidationFunc,
    },
    {
        name: OCResourceEnum.SellerApprovalRules,
        openApiSchemaName: "SellerApprovalRule",
        sdkObject: SellerApprovalRules,
        createPriority: 4,
        isAssignment: false,
        isChild: false,
        isParent: false,
        openApiCreatePath: "/approvalrules",
        isSellerOwned: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Owner,
                fieldOnThisResource: "OwnerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ],
        customValidationFunc: SellerApprovalRuleValidationFunc
    },
    {
        name: OCResourceEnum.SecurityProfileAssignments, 
        openApiSchemaName: "SecurityProfileAssignment",
        sdkObject: SecurityProfiles,
        openApiCreatePath: "/securityprofiles/assignments",
        createPriority: 6,
        isAssignment: true,
        isChild: false,
        isParent: false,
        isSellerOwned: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "SecurityProfileID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SecurityProfiles,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "BuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "SupplierID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
        ], 
        customValidationFunc: SecurityProfileAssignmentValidationFunc
    },
    {
        name: OCResourceEnum.AdminUserGroupAssignments, 
        openApiSchemaName: "UserGroupAssignment",
        sdkObject: AdminUserGroups,
        createPriority: 3,
        isAssignment: true,
        isChild: false,
        isParent: false,
        isSellerOwned: false,
        openApiCreatePath: "/usergroups/assignments",
        openApiListOperation: 'ListUserAssignments',
        openApiCreateOperation: 'SaveUserAssignment',
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "UserID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.AdminUsers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "UserGroupID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.AdminUserGroups,
            },
        ]
    },
    {
        name: OCResourceEnum.ApiClientAssignments, 
        openApiSchemaName: "ApiClientAssignment",
        sdkObject: ApiClients,
        createPriority: 7,
        isAssignment: true,
        isChild: false,
        isParent: false,
        isSellerOwned: false,
        openApiCreatePath: "/apiclients/assignments",
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "ApiClientID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.ApiClients,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "BuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "SupplierID",
                fieldOnOtherReasource: "ID", 
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
        openApiSchemaName: "LocaleAssignment",
        sdkObject: Locales,
        createPriority: 6,
        isAssignment: true,
        isChild: false,
        isParent: false,
        isSellerOwned: false,
        openApiCreatePath: "/locales/assignments",
        customValidationFunc: LocaleAssignmentCustomValidationFunc,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "LocaleID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Locales,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "BuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "UserGroupID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Users,
                foreignParentRefField: "BuyerID",
            },
        ],
    },
    {
        name: OCResourceEnum.UserGroupAssignments, 
        openApiSchemaName: "UserGroupAssignment",
        sdkObject: UserGroups,
        createPriority: 6,
        isAssignment: true,
        openApiCreatePath: "/buyers/{buyerID}/usergroups/assignments",
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        openApiCreateOperation: "SaveUserAssignment",
        openApiListOperation: 'ListUserAssignments',
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "BuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "UserID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Users,
                foreignParentRefField: "BuyerID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "UserGroupID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
                foreignParentRefField: "BuyerID",
            },
        ],           
    },
    {
        name: OCResourceEnum.AddressAssignments, 
        openApiSchemaName: "AddressAssignment",
        sdkObject: Addresses,
        createPriority: 6,
        openApiCreatePath: "/buyers/{buyerID}/addresses/assignments",
        isAssignment: true,
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "BuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "AddressID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Addresses,
                foreignParentRefField: "BuyerID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "UserID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Users,
                foreignParentRefField: "BuyerID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "UserGroupID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
                foreignParentRefField: "BuyerID",
            },
        ],
    },
    {
        name: OCResourceEnum.CostCenterAssignments, 
        openApiSchemaName: "CostCenterAssignment",
        sdkObject: CostCenters,
        createPriority: 6,
        openApiCreatePath: "/buyers/{buyerID}/costcenters",
        isAssignment: true,
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "BuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "CostCenterID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.CostCenters,
                foreignParentRefField: "BuyerID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "UserGroupID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
                foreignParentRefField: "BuyerID",
            },
        ],       
    },
    {
        name: OCResourceEnum.CreditCardAssignments, 
        openApiSchemaName: "CreditCardAssignment",
        sdkObject: CreditCards,
        createPriority: 6,
        openApiCreatePath: "/buyers/{buyerID}/creditcards/assignments",
        isAssignment: true,
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "BuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "CreditCardID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.CreditCards,
                foreignParentRefField: "BuyerID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "UserID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Users,
                foreignParentRefField: "BuyerID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "UserGroupID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
                foreignParentRefField: "BuyerID",
            },
        ],
    },
    {
        name: OCResourceEnum.SpendingAccountAssignments, 
        openApiSchemaName: "SpendingAccountAssignment",
        sdkObject: SpendingAccounts,
        createPriority: 6,
        openApiCreatePath: "/buyers/{buyerID}/spendingaccounts/assignments",
        isAssignment: true,
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "BuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "SpendingAccountID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SpendingAccounts,
                foreignParentRefField: "BuyerID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "UserID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Users,
                foreignParentRefField: "BuyerID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "UserGroupID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
                foreignParentRefField: "BuyerID",
            },
        ],   
    },
    {
        name: OCResourceEnum.SupplierUserGroupsAssignments, 
        openApiSchemaName: "UserGroupAssignment",
        sdkObject: SupplierUserGroups,
        createPriority: 4,
        openApiCreatePath: "/suppliers/{supplierID}/usergroups/assignments",
        isAssignment: true,
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        openApiListOperation: 'ListUserAssignments',
        openApiCreateOperation: 'SaveUserAssignment',
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "SupplierID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "UserID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SupplierUsers,
                foreignParentRefField: "SupplierID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "UserGroupID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SupplierUserGroups,
                foreignParentRefField: "SupplierID",
            },
        ],           
    },
    {
        name: OCResourceEnum.ProductAssignments, 
        openApiSchemaName: "ProductAssignment",
        sdkObject: Products,
        createPriority: 6,
        openApiCreatePath: "/products/assignments",
        isAssignment: true,
        isChild: false,
        isParent: false,
        isSellerOwned: true,
        customValidationFunc: ProductAssignmentValidationFunc,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Owner,
                fieldOnThisResource: "SellerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "ProductID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "BuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "PriceScheduleID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.PriceSchedules,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "UserGroupID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
                foreignParentRefField: "BuyerID",
            },
        ],         
    },
    {
        name: OCResourceEnum.CatalogAssignments,
        openApiSchemaName: "CatalogAssignment",
        sdkObject: Catalogs,
        createPriority: 5,
        openApiCreatePath: "/catalogs/assignments",
        isAssignment: true,
        isChild: false,
        isParent: false,
        isSellerOwned: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "CatalogID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Catalogs,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "BuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
        ]           
    },
    {
        name: OCResourceEnum.ProductCatalogAssignment, 
        openApiSchemaName: "ProductCatalogAssignment",
        sdkObject: Catalogs,
        createPriority: 5,
        openApiCreatePath: "/catalogs/productassignments",
        isAssignment: true,
        isChild: false,
        isParent: false,
        isSellerOwned: false,
        openApiListOperation: 'ListProductAssignments',
        openApiCreateOperation: 'SaveProductAssignment',
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "CatalogID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Catalogs,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "ProductID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
        ]                   
    },
    {
        name: OCResourceEnum.CategoryAssignments, 
        openApiSchemaName: "CategoryAssignment",
        sdkObject: Categories,
        createPriority: 6,
        openApiCreatePath: "/catalogs/{catalogID}/categories/assignments",
        isAssignment: true,
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "CatalogID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Catalogs,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "CategoryID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Categories,
                foreignParentRefField: "CatalogID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "BuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "UserGroupID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
                foreignParentRefField: "BuyerID",
            },
        ]           
    },
    {
        name: OCResourceEnum.CategoryProductAssignments, 
        openApiSchemaName: "CategoryProductAssignment",
        sdkObject: Categories,
        createPriority: 5,
        openApiCreatePath: "/catalogs/{catalogID}/categories/productassignments",
        isAssignment: true,
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        openApiListOperation: 'ListProductAssignments',
        openApiCreateOperation: 'SaveProductAssignment',
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "CatalogID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Catalogs,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "CategoryID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Categories,
                foreignParentRefField: "CatalogID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "ProductID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
        ]           
    },
    {
        name: OCResourceEnum.SpecProductAssignments, 
        openApiSchemaName: "SpecProductAssignment",
        sdkObject: Specs,
        createPriority: 5,
        openApiCreatePath: "/specs/productassignments",
        isAssignment: true,
        isChild: false,
        isParent: false,
        isSellerOwned: false,
        openApiListOperation: 'ListProductAssignments',
        openApiCreateOperation: 'SaveProductAssignment',
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "SpecID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Specs,
                foreignParentRefField: "CatalogID",
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "ProductID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "DefaultOptionID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SpecOptions,
                foreignParentRefField: "SpecID",
            },
        ]
    },
    {
        name: OCResourceEnum.PromotionAssignments, 
        openApiSchemaName: "PromotionAssignment",
        sdkObject: Promotions,
        createPriority: 6,
        openApiCreatePath: "/promotions/assignments",
        isAssignment: true,
        isChild: false,
        isParent: false,
        isSellerOwned: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "PromotionID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Promotions,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "BuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "UserGroupID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroups,
                foreignParentRefField: "BuyerID",
            },
        ]
    },
    {
        name: OCResourceEnum.ProductSupplierAssignments, 
        openApiSchemaName: "ProductSupplier",
        sdkObject: Products,
        createPriority: 5,
        openApiCreatePath: "/products/{productID}/suppliers/{supplierID}",
        secondRouteParam: "SupplierID",
        isAssignment: true,
        isChild: true,
        isParent: false,
        isSellerOwned: false,
        openApiListOperation: 'ListSuppliers',
        openApiCreateOperation: 'SaveSupplier',
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "ProductID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Products,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "SupplierID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "DefaultPriceScheduleID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.PriceSchedules,
            },
        ],
        downloadTransformFunc: (x) => { 
            return { SupplierID: x.ID, DefaultPriceScheduleID: x.DefaultPriceScheduleID };
        }
    },
    {
        name: OCResourceEnum.SupplierBuyerAssignments, 
        openApiSchemaName: "SupplierBuyer",
        sdkObject: Suppliers,
        createPriority: 5,
        openApiCreatePath: "/suppliers/{supplierID}/buyers/{buyerID}",
        secondRouteParam: "BuyerID",
        isChild: true,
        isAssignment: true,
        isParent: false,
        isSellerOwned: false,
        openApiListOperation: 'ListBuyers',
        openApiCreateOperation: 'SaveBuyer',
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Parent,
                fieldOnThisResource: "SupplierID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "BuyerID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyers,
            },
            { 
                referenceType: ResourceReferenceType.Horizontal,
                fieldOnThisResource: "SupplierID",
                fieldOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Suppliers,
            }
        ],
        downloadTransformFunc: (x) => { 
            return { BuyerID: x.ID };
        }
    },
];

function ApplyDefaults(resource: OCResource): OCResource {
    resource.openApiListOperation = resource.openApiListOperation || (resource.isAssignment ? "ListAssignments" : "List");
    resource.openApiCreateOperation = resource.openApiCreateOperation || (resource.isAssignment ? "SaveAssignment" : "Create");
    resource.outgoingResourceReferences = resource.outgoingResourceReferences || [];
    resource.children = resource.children || [];
    resource.requiredCreateFields = resource.requiredCreateFields ?? [];
    resource.redactFields = resource.redactFields ?? [];
    resource.isSellerOwned = resource.isSellerOwned ?? null;
    resource.shouldAttemptListFunc = resource.shouldAttemptListFunc ?? ((x) => true);
    return resource;

}

export async function BuildResourceDirectory(): Promise<OCResource[]> {
    var openAPISpec = await axios.get(`https://api.ordercloud.io/v1/openapi/v3`) 
    return Directory.map(resource => {  
        var modified = ApplyDefaults(resource);
        var path = openAPISpec.data.paths[resource.openApiCreatePath];
        var operation = path.post ?? path.put;
        modified.requiredCreateFields = operation?.requestBody?.content?.["application/json"]?.schema?.required ?? [];
        modified.openApiProperties = openAPISpec.data.components.schemas[resource.openApiSchemaName].properties;
        if (modified.isChild) {
            modified.parentResource = Directory.find(x => x.children?.includes(modified.name));
        }
        return modified;
    });
}

