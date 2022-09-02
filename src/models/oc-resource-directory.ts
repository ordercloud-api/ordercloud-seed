import axios from "axios";
import { Addresses, AdminAddresses, InventoryRecords, AdminUserGroups, AdminUsers, ApiClients, ApprovalRules, Buyers, Catalogs, Categories, CostCenters, CreditCards, ImpersonationConfigs, Incrementors, IntegrationEvents, Locales, MessageSenders, OpenIdConnects, PriceSchedules, ProductFacets, Products, Promotions, SecurityProfiles, Specs, SpendingAccounts, SupplierAddresses, Suppliers, SupplierUserGroups, SupplierUsers, UserGroups, Users, Webhooks, XpIndices, SellerApprovalRules } from "ordercloud-javascript-sdk";
import { OCResourceEnum } from "./oc-resource-enum";
import { OCResource } from "./oc-resources";
import _ from 'lodash';
import { ApiClientValidationFunc, ImpersonationConfigValidationFunc, InventoryRecordValidationFunc, LocaleAssignmentCustomValidationFunc, ProductAssignmentValidationFunc, ProductValidationFunc, SecurityProfileAssignmentValidationFunc, SellerApprovalRuleValidationFunc, VariantInventoryRecordValidationFunc, VariantValidationFunc, WebhookValidationFunc } from "../services/custom-validation-func";

const Directory: OCResource[] = [
    { 
        name: OCResourceEnum.SecurityProfiles,
        modelName: 'SecurityProfile',
        sdkObject: SecurityProfiles,
        createPriority: 2,
        path: "/securityprofiles"
    },
    { 
        name: OCResourceEnum.ImpersonationConfigs,
        modelName: 'ImpersonationConfig',
        sdkObject: ImpersonationConfigs,
        createPriority: 7,
        path: "/impersonationconfig",
        customValidationFunc: ImpersonationConfigValidationFunc,
        foreignKeys: {
            ClientID: { foreignResource: OCResourceEnum.ApiClients },
            SecurityProfileID: { foreignResource: OCResourceEnum.SecurityProfiles },
            BuyerID: { foreignResource: OCResourceEnum.Buyers },
            GroupID: { 
                foreignResource: OCResourceEnum.UserGroups,
                foreignParentRefField: "BuyerID" 
            },
            UserID: { 
                foreignResource: OCResourceEnum.Users,
                foreignParentRefField: "BuyerID"  
            },
            ImpersonationBuyerID: { foreignResource: OCResourceEnum.Buyers },
        }
    },
    {
        name: OCResourceEnum.OpenIdConnects,
        modelName: 'OpenIdConnect',
        sdkObject: OpenIdConnects,
        createPriority: 7,
        path: "/openidconnects",
        redactFields: ["ConnectClientSecret"],
        foreignKeys: 
        {
            OrderCloudApiClientID: { foreignResource: OCResourceEnum.ApiClients },
            IntegrationEventID: { foreignResource: OCResourceEnum.IntegrationEvents }
        }
    },
    {
        name: OCResourceEnum.AdminUsers,
        modelName: 'User',
        sdkObject: AdminUsers,
        path: "/adminusers",
        createPriority: 2,
        hasOwnerIDField: "CompanyID",
        downloadTransformFunc: (x) => { 
            delete x.Locale;
            return x;
        }
    },
    {
        name: OCResourceEnum.AdminUserGroups, 
        modelName: 'UserGroup',
        sdkObject: AdminUserGroups,
        path: "/usergroups",
        createPriority: 2
    },
    {
        name: OCResourceEnum.AdminAddresses, 
        modelName: 'Address',
        sdkObject: AdminAddresses,
        path: "/addresses",
        createPriority: 2
    },
    {
        name: OCResourceEnum.MessageSenders,  
        modelName: 'MessageSender',
        sdkObject: MessageSenders,
        path: "/messagesenders",
        createPriority: 2,
        redactFields: ["SharedKey"],
    },
    {
        name: OCResourceEnum.ApiClients, 
        modelName: 'ApiClient',
        sdkObject: ApiClients,
        createPriority: 6,
        path: "/apiclients",
        redactFields: ["ClientSecret"],
        foreignKeys:
        {
            OrderCheckoutIntegrationEventID: { foreignResource: OCResourceEnum.IntegrationEvents },
            OrderReturnIntegrationEventID: { foreignResource: OCResourceEnum.IntegrationEvents }
        },
        downloadTransformFunc: (x) => {
            x.ID = x.ID.toLowerCase(); // funky platform thing with API CLient ID casing
            return x;
        },
        customValidationFunc: ApiClientValidationFunc, 
    },
    {
        name: OCResourceEnum.Locales,
        modelName: 'Locale',
        sdkObject: Locales,
        path: "/locales",
        createPriority: 3,
        hasOwnerIDField: "OwnerID",
    },
    {
        name: OCResourceEnum.Incrementors,
        modelName: 'Incrementor',
        sdkObject: Incrementors,
        path: "/incrementors",
        createPriority: 1,
    },
    {
        name: OCResourceEnum.Webhooks, 
        modelName: 'Webhook',
        sdkObject: Webhooks,
        createPriority: 7,
        path: "/webhooks",
        redactFields: ["HashKey"],
        // for .ApiClientIDs
        customValidationFunc: WebhookValidationFunc
    },
    {
        name: OCResourceEnum.IntegrationEvents, 
        modelName: 'IntegrationEvent',
        sdkObject: IntegrationEvents,
        path: "/integrationEvents",
        createPriority: 2,
        redactFields: ["HashKey"],
    },
    {
        name: OCResourceEnum.XpIndices, 
        modelName: "XpIndex",
        sdkObject: XpIndices,
        path: "/xpindices",
        createPriority: 1,
        createMethodName: "Put"
    },
    {
        name: OCResourceEnum.Buyers, 
        modelName: "Buyer",
        sdkObject: Buyers,
        createPriority: 4,
        path: "/buyers",
        foreignKeys:
        {
            DefaultCatalogID: { foreignResource: OCResourceEnum.Catalogs }
        },
        children: [OCResourceEnum.Users, OCResourceEnum.UserGroups, OCResourceEnum.Addresses, OCResourceEnum.CostCenters, OCResourceEnum.CreditCards, OCResourceEnum.SpendingAccounts, OCResourceEnum.ApprovalRules, OCResourceEnum.UserGroupAssignments, OCResourceEnum.SpendingAccountAssignments, OCResourceEnum.AddressAssignments, OCResourceEnum.CostCenterAssignments, OCResourceEnum.CreditCardAssignments],
    },
    {
        name: OCResourceEnum.Users, 
        modelName: "User",
        sdkObject: Users,
        createPriority: 5,
        parentRefField: "BuyerID",
        path: "/buyers/{buyerID}/users",
        isChild: true,
        downloadTransformFunc: (x) => { 
            delete x.Locale;
            return x;
        }
    },
    {
        name: OCResourceEnum.UserGroups,
        modelName: "UserGroup",
        sdkObject: UserGroups,
        createPriority: 5,
        parentRefField: "BuyerID",
        path: "/buyers/{buyerID}/usergroups",
        isChild: true,
    },
    {
        name: OCResourceEnum.Addresses,
        modelName: "Address",
        sdkObject: Addresses,
        createPriority: 5,
        parentRefField: "BuyerID",
        path: "/buyers/{buyerID}/addresses",
        isChild: true,
    },
    {
        name: OCResourceEnum.CostCenters,
        modelName: "CostCenter",
        sdkObject: CostCenters,
        createPriority: 5,
        parentRefField: "BuyerID",
        path: "/buyers/{buyerID}/costcenters",
        isChild: true,
    },
    {
        name: OCResourceEnum.CreditCards,
        modelName: "CreditCard",
        sdkObject: CreditCards,
        createPriority: 5,
        parentRefField: "BuyerID",
        path: "/buyers/{buyerID}/creditcards",
        isChild: true,
    },
    {
        name: OCResourceEnum.SpendingAccounts,
        modelName: "SpendingAccount",
        sdkObject: SpendingAccounts,
        createPriority: 5,
        parentRefField: "BuyerID",
        path: "/buyers/{buyerID}/spendingaccounts",
        isChild: true,
    },
    {
        name: OCResourceEnum.ApprovalRules,
        modelName:"ApprovalRule",
        sdkObject: ApprovalRules,
        createPriority: 6,
        parentRefField: "BuyerID",
        isChild: true,
        path: "/buyers/{buyerID}/approvalrules",
        foreignKeys: {
            ApprovingGroupID: { 
                foreignParentRefField: "BuyerID",
                foreignResource: OCResourceEnum.UserGroups 
            }
        }
    },
    {
        name: OCResourceEnum.Catalogs, 
        modelName: "Catalog",
        sdkObject: Catalogs,
        createPriority: 3,
        path: "/catalogs",
        hasOwnerIDField: "OwnerID",
        children: [OCResourceEnum.Categories, OCResourceEnum.CategoryAssignments, OCResourceEnum.CategoryProductAssignments]
    },
    {
        name: OCResourceEnum.Categories,
        modelName: "Category",
        sdkObject: Categories,
        createPriority: 4,
        parentRefField: "CatalogID",
        isChild: true,
        path: "/catalogs/{catalogID}/categories",
        foreignKeys: {
            ParentID: {
                foreignParentRefField: "CatalogID", 
                foreignResource: OCResourceEnum.Categories 
            }
        }
    },
    {
        name: OCResourceEnum.Suppliers, 
        modelName: "Supplier",
        sdkObject: Suppliers,
        createPriority: 2,
        path: "/suppliers",
        children: [OCResourceEnum.SupplierUsers, OCResourceEnum.SupplierUserGroups, OCResourceEnum.SupplierAddresses, OCResourceEnum.SupplierUserGroupsAssignments, OCResourceEnum.SupplierBuyerAssignment]
    },
    {
        name: OCResourceEnum.SupplierUsers, 
        modelName: "User",
        sdkObject: SupplierUsers,
        createPriority: 3,
        parentRefField: "SupplierID",
        path: "/suppliers/{supplierID}/users",
        isChild: true,
        downloadTransformFunc: (x) => { 
            delete x.Locale;
            return x;
        }
    },
    {
        name: OCResourceEnum.SupplierUserGroups, 
        modelName: "UserGroup",
        sdkObject: SupplierUserGroups,
        createPriority: 3,
        parentRefField: "SupplierID",
        path: "/suppliers/{supplierID}/usergroups",
        isChild: true,
    },
    {
        name: OCResourceEnum.SupplierAddresses,
        modelName: "Address",
        sdkObject: SupplierAddresses,
        createPriority: 3,
        parentRefField: "SupplierID",
        path: "/suppliers/{supplierID}/addresses",
        isChild: true,
    },
    {
        name: OCResourceEnum.Products, 
        modelName: "Product",
        sdkObject: Products,
        createPriority: 4,
        path: "/products",
        hasOwnerIDField: "OwnerID",
        foreignKeys: {
            DefaultPriceScheduleID: { foreignResource: OCResourceEnum.PriceSchedules },
            DefaultSupplierID: { foreignResource: OCResourceEnum.Suppliers }
        },
        children: [OCResourceEnum.ProductSupplierAssignment, OCResourceEnum.Variants, OCResourceEnum.InventoryRecords],
        customValidationFunc: ProductValidationFunc
    },
    {
        name: OCResourceEnum.PriceSchedules, 
        modelName: "PriceSchedule",
        sdkObject: PriceSchedules,
        path: "/priceschedules",
        createPriority: 3,
        hasOwnerIDField: "OwnerID",
    },
    {
        name: OCResourceEnum.Specs, 
        modelName: "Spec",
        sdkObject: Specs,
        createPriority: 3,
        path: "/specs",
        hasOwnerIDField: "OwnerID",
        foreignKeys: {
            DefaultOptionID: { foreignResource: OCResourceEnum.SpecOptions, foreignParentRefField: "ID" },
        },
        children: [OCResourceEnum.SpecOptions]
    },
    {
        name: OCResourceEnum.SpecOptions, 
        modelName: "SpecOption",
        sdkObject: Specs,
        createPriority: 4,
        path: "/specs/{specID}/options",
        parentRefField: "SpecID",
        listMethodName: "ListOptions",
        createMethodName: "CreateOption",
        isChild: true
    },
    {
        name: OCResourceEnum.ProductFacets,
        modelName: "ProductFacet",
        sdkObject: ProductFacets,
        path: "/productfacets",
        createPriority: 2
    },
    {
        name: OCResourceEnum.Promotions, 
        modelName: "Promotion",
        sdkObject: Promotions,
        path: "/promotions",
        createPriority: 3,
        hasOwnerIDField: "OwnerID"
    },
    {
        name: OCResourceEnum.Variants, 
        modelName: "Variant",
        sdkObject: Products,
        createPriority: 6,
        path: "/products/{productID}/variants",
        parentRefField: "ProductID",
        isChild: true,
        listMethodName: 'ListVariants',
        customValidationFunc: VariantValidationFunc,
        shouldAttemptListFunc: (product) => (product?.VariantCount > 0)
    },
    {
        name: OCResourceEnum.InventoryRecords, 
        modelName: "InventoryRecord",
        sdkObject: InventoryRecords,
        createPriority: 5,
        path: "/products/{productID}/inventoryrecords",
        parentRefField: "ProductID",
        isChild: true,
        hasOwnerIDField: "OwnerID",
        customValidationFunc: InventoryRecordValidationFunc,
    },
    {
        name: OCResourceEnum.VariantInventoryRecords, 
        modelName: "InventoryRecord",
        sdkObject: InventoryRecords,
        createPriority: 7,
        path: "/products/{productID}/variants/{variantID}/inventoryrecords",
        parentRefField: "ProductID",
        secondRouteParam: "VariantID",
        isChild: true,
        listMethodName: 'ListVariant',
        createMethodName: 'CreateVariant',
        hasOwnerIDField: 'OwnerID',
        foreignKeys: {
            VariantID: { 
                foreignParentRefField: "ProductID",
                foreignResource: OCResourceEnum.Variants 
            },
            ProductID: { foreignResource: OCResourceEnum.Products }
        },
        customValidationFunc: VariantInventoryRecordValidationFunc,
    },
    {
        name: OCResourceEnum.SellerApprovalRules,
        modelName: "SellerApprovalRule",
        sdkObject: SellerApprovalRules,
        createPriority: 4,
        path: "/approvalrules",
        hasOwnerIDField: "OwnerID",
        customValidationFunc: SellerApprovalRuleValidationFunc
    },
    {
        name: OCResourceEnum.SecurityProfileAssignments, 
        modelName: "SecurityProfileAssignment",
        sdkObject: SecurityProfiles,
        path: "/securityprofiles/assignments",
        createPriority: 6,
        isAssignment: true,
        foreignKeys: {
            SecurityProfileID: { foreignResource: OCResourceEnum.SecurityProfiles },
            BuyerID: { foreignResource: OCResourceEnum.Buyers },
            SupplierID: { foreignResource: OCResourceEnum.Suppliers },
        },
        customValidationFunc: SecurityProfileAssignmentValidationFunc
    },
    {
        name: OCResourceEnum.AdminUserGroupAssignments, 
        modelName: "UserGroupAssignment",
        sdkObject: AdminUserGroups,
        createPriority: 3,
        isAssignment: true,
        path: "/usergroups/assignments",
        listMethodName: 'ListUserAssignments',
        createMethodName: 'SaveUserAssignment',
        foreignKeys: {
            UserID: { foreignResource: OCResourceEnum.AdminUsers },
            UserGroupID: { foreignResource: OCResourceEnum.AdminUserGroups },
        },
    },
    {
        name: OCResourceEnum.ApiClientAssignments, 
        modelName: "ApiClientAssignment",
        sdkObject: ApiClients,
        createPriority: 7,
        isAssignment: true,
        path: "/apiclients/assignments",
        foreignKeys: {
            ApiClientID: { foreignResource: OCResourceEnum.ApiClients },
            BuyerID: { foreignResource: OCResourceEnum.Buyers },
            SupplierID: { foreignResource: OCResourceEnum.Suppliers },
        },
        downloadTransformFunc: (x) => {
            x.ApiClientID = x.ApiClientID.toLowerCase(); // funky platform thing with API CLient ID casing
            return x;
        },
    },
    {
        name: OCResourceEnum.LocaleAssignments, 
        modelName: "LocaleAssignment",
        sdkObject: Locales,
        createPriority: 6,
        isAssignment: true,
        path: "/locales/assignments",
        customValidationFunc: LocaleAssignmentCustomValidationFunc,
        foreignKeys: {
            LocaleID: { 
                foreignResource: OCResourceEnum.Locales 
            },
            BuyerID: { 
                foreignResource: OCResourceEnum.Buyers 
            },
            UserGroupID: {
                foreignParentRefField: "BuyerID",
                foreignResource: OCResourceEnum.Users
            }
        },
    },
    {
        name: OCResourceEnum.UserGroupAssignments, 
        modelName: "UserGroupAssignment",
        sdkObject: UserGroups,
        createPriority: 6,
        isAssignment: true,
        path: "/buyers/{buyerID}/usergroups/assignments",
        parentRefField: "BuyerID",
        isChild: true,
        createMethodName: "SaveUserAssignment",
        listMethodName: 'ListUserAssignments',
        foreignKeys: {
            UserID: { 
                foreignParentRefField: "BuyerID",
                foreignResource: OCResourceEnum.Users 
            },
            UserGroupID: { 
                foreignParentRefField: "BuyerID",
                foreignResource: OCResourceEnum.UserGroups 
            },
        },
    },
    {
        name: OCResourceEnum.AddressAssignments, 
        modelName: "AddressAssignment",
        sdkObject: Addresses,
        createPriority: 6,
        path: "/buyers/{buyerID}/addresses/assignments",
        isAssignment: true,
        parentRefField: "BuyerID",
        isChild: true,
        foreignKeys: {
            AddressID: { 
                foreignParentRefField: "BuyerID",
                foreignResource: OCResourceEnum.Addresses 
            },
            UserID: { 
                foreignParentRefField: "BuyerID",
                foreignResource: OCResourceEnum.Users 
            },
            UserGroupID: { 
                foreignParentRefField: "BuyerID",
                foreignResource: OCResourceEnum.UserGroups 
            },
        },
    },
    {
        name: OCResourceEnum.CostCenterAssignments, 
        modelName: "CostCenterAssignment",
        sdkObject: CostCenters,
        createPriority: 6,
        path: "/buyers/{buyerID}/costcenters",
        isAssignment: true,
        parentRefField: "BuyerID",
        isChild: true,
        foreignKeys: {
            CostCenterID: { 
                foreignParentRefField: "BuyerID",
                foreignResource: OCResourceEnum.CostCenters 
            },
            UserGroupID: { 
                foreignParentRefField: "BuyerID",
                foreignResource: OCResourceEnum.UserGroups, 
            },
        },
    },
    {
        name: OCResourceEnum.CreditCardAssignments, 
        modelName: "CreditCardAssignment",
        sdkObject: CreditCards,
        createPriority: 6,
        path: "/buyers/{buyerID}/creditcards/assignments",
        isAssignment: true,
        parentRefField: "BuyerID",
        isChild: true,
        foreignKeys: {
            CreditCardID: { 
                foreignParentRefField: "BuyerID",
                foreignResource: OCResourceEnum.CreditCards 
            },
            UserID: { 
                foreignParentRefField: "BuyerID",
                foreignResource: OCResourceEnum.Users 
            },
            UserGroupID: { 
                foreignParentRefField: "BuyerID",
                foreignResource: OCResourceEnum.UserGroups 
            },
        },
    },
    {
        name: OCResourceEnum.SpendingAccountAssignments, 
        modelName: "SpendingAccountAssignment",
        sdkObject: SpendingAccounts,
        createPriority: 6,
        path: "/buyers/{buyerID}/spendingaccounts/assignments",
        isAssignment: true,
        parentRefField: "BuyerID",
        isChild: true,
        foreignKeys: {
            SpendingAccountID: { 
                foreignParentRefField: "BuyerID",
                foreignResource: OCResourceEnum.SpendingAccounts 
            },
            UserID: { 
                foreignParentRefField: "BuyerID",
                foreignResource: OCResourceEnum.Users 
            },
            UserGroupID: { 
                foreignParentRefField: "BuyerID",
                foreignResource: OCResourceEnum.UserGroups 
            },
        },
    },
    {
        name: OCResourceEnum.SupplierUserGroupsAssignments, 
        modelName: "UserGroupAssignment",
        sdkObject: SupplierUserGroups,
        createPriority: 4,
        path: "/suppliers/{supplierID}/usergroups/assignments",
        isAssignment: true,
        parentRefField: "SupplierID",
        isChild: true,
        listMethodName: 'ListUserAssignments',
        createMethodName: 'SaveUserAssignment',
        foreignKeys: {
            UserID: { 
                foreignParentRefField: "SupplierID",
                foreignResource: OCResourceEnum.SupplierUsers 
            },
            UserGroupID: { 
                foreignParentRefField: "SupplierID",
                foreignResource: OCResourceEnum.SupplierUserGroups 
            },
        },
    },
    {
        name: OCResourceEnum.ProductAssignments, 
        modelName: "ProductAssignment",
        sdkObject: Products,
        createPriority: 6,
        path: "/products/assignments",
        isAssignment: true,
        hasOwnerIDField: "SellerID",
        customValidationFunc: ProductAssignmentValidationFunc,
        foreignKeys: {
            ProductID: { foreignResource: OCResourceEnum.Products },
            BuyerID: { foreignResource: OCResourceEnum.Buyers },
            UserGroupID: { 
                foreignParentRefField: "BuyerID",
                foreignResource: OCResourceEnum.UserGroups 
            },
            PriceScheduleID: { foreignResource: OCResourceEnum.PriceSchedules }
        },
    },
    {
        name: OCResourceEnum.CatalogAssignments,
        modelName: "CatalogAssignment",
        sdkObject: Catalogs,
        createPriority: 5,
        path: "/catalogs/assignments",
        isAssignment: true,
        foreignKeys: {
            CatalogID: { foreignResource: OCResourceEnum.Catalogs },
            BuyerID: { foreignResource: OCResourceEnum.Buyers }
        },
    },
    {
        name: OCResourceEnum.ProductCatalogAssignment, 
        modelName: "ProductCatalogAssignment",
        sdkObject: Catalogs,
        createPriority: 5,
        path: "/catalogs/productassignments",
        isAssignment: true,
        listMethodName: 'ListProductAssignments',
        createMethodName: 'SaveProductAssignment',
        foreignKeys: {
            CatalogID: { foreignResource: OCResourceEnum.Catalogs },
            ProductID: { foreignResource: OCResourceEnum.Products }
        },
    },
    {
        name: OCResourceEnum.CategoryAssignments, 
        modelName: "CategoryAssignment",
        sdkObject: Categories,
        createPriority: 6,
        path: "/catalogs/{catalogID}/categories/assignments",
        isAssignment: true,
        parentRefField: "CatalogID",
        isChild: true,
        foreignKeys: {
            CategoryID: { 
                foreignParentRefField: "CatalogID",
                foreignResource: OCResourceEnum.Categories 
            },
            BuyerID: { foreignResource: OCResourceEnum.Buyers },
            UserGroupID: { 
                foreignParentRefField: "BuyerID",
                foreignResource: OCResourceEnum.UserGroups 
            },
        },
    },
    {
        name: OCResourceEnum.CategoryProductAssignments, 
        modelName: "CategoryProductAssignment",
        sdkObject: Categories,
        createPriority: 5,
        path: "/catalogs/{catalogID}/categories/productassignments",
        isAssignment: true,
        parentRefField: "CatalogID",
        isChild: true,
        listMethodName: 'ListProductAssignments',
        createMethodName: 'SaveProductAssignment',
        foreignKeys: {
            CategoryID: { 
                foreignParentRefField: "CatalogID",
                foreignResource: OCResourceEnum.Categories 
            },
            ProductID: { foreignResource: OCResourceEnum.Products },
        },
    },
    {
        name: OCResourceEnum.SpecProductAssignments, 
        modelName: "SpecProductAssignment",
        sdkObject: Specs,
        createPriority: 5,
        path: "/specs/productassignments",
        isAssignment: true,
        listMethodName: 'ListProductAssignments',
        createMethodName: 'SaveProductAssignment',
        foreignKeys: {
            SpecID: { foreignResource: OCResourceEnum.Specs },
            ProductID: { foreignResource: OCResourceEnum.Products },
            DefaultOptionID: { 
                foreignParentRefField: "SpecID",
                foreignResource: OCResourceEnum.SpecOptions 
            },
        },
    },
    {
        name: OCResourceEnum.PromotionAssignment, 
        modelName: "PromotionAssignment",
        sdkObject: Promotions,
        createPriority: 6,
        path: "/promotions/assignments",
        isAssignment: true,
        foreignKeys: {
            PromotionID: { foreignResource: OCResourceEnum.Promotions },
            BuyerID: { foreignResource: OCResourceEnum.Buyers },
            UserGroupID: { 
                foreignParentRefField: "BuyerID",
                foreignResource: OCResourceEnum.UserGroups 
            },
        },
    },
    {
        name: OCResourceEnum.ProductSupplierAssignment, 
        modelName: "ProductSupplier",
        sdkObject: Products,
        createPriority: 5,
        path: "/products/{productID}/suppliers/{supplierID}",
        parentRefField: "ProductID",
        secondRouteParam: "SupplierID",
        isAssignment: true,
        isChild: true,
        listMethodName: 'ListSuppliers',
        createMethodName: 'SaveSupplier',
        foreignKeys: {
            ProductID: { foreignResource: OCResourceEnum.Products },
            SupplierID: { foreignResource: OCResourceEnum.Suppliers },
            DefaultPriceScheduleID: { foreignResource: OCResourceEnum.PriceSchedules } 
        },
        downloadTransformFunc: (x) => { 
            return { SupplierID: x.ID, DefaultPriceScheduleID: x.DefaultPriceScheduleID };
        }
    },
    {
        name: OCResourceEnum.SupplierBuyerAssignment, 
        modelName: "SupplierBuyer",
        sdkObject: Suppliers,
        createPriority: 5,
        path: "/suppliers/{supplierID}/buyers/{buyerID}",
        parentRefField: "SupplierID",
        secondRouteParam: "BuyerID",
        isChild: true,
        isAssignment: true,
        listMethodName: 'ListBuyers',
        createMethodName: 'SaveBuyer',
        foreignKeys: {
            BuyerID: { foreignResource: OCResourceEnum.Buyers },
            SupplierID: { foreignResource: OCResourceEnum.Suppliers },
        },
        downloadTransformFunc: (x) => { 
            return { BuyerID: x.ID };
        }
    },
];

function ApplyDefaults(resource: OCResource): OCResource {
    resource.isAssignment = resource.isAssignment || false;
    resource.listMethodName = resource.listMethodName || (resource.isAssignment ? "ListAssignments" : "List");
    resource.createMethodName = resource.createMethodName || (resource.isAssignment ? "SaveAssignment" : "Create");
    resource.foreignKeys = resource.foreignKeys || {};
    resource.children = resource.children || [];
    resource.isChild = resource.isChild || false;
    resource.requiredCreateFields = resource.requiredCreateFields ?? [];
    resource.redactFields = resource.redactFields ?? [];
    resource.hasOwnerIDField = resource.hasOwnerIDField ?? null;
    resource.shouldAttemptListFunc = resource.shouldAttemptListFunc ?? ((x) => true);
    return resource;

}

export async function BuildResourceDirectory(): Promise<OCResource[]> {
    var openAPISpec = await axios.get(`https://api.ordercloud.io/v1/openapi/v3`) 
    return Directory.map(resource => {  
        var modified = ApplyDefaults(resource);
        var path = openAPISpec.data.paths[resource.path];
        var operation = path.post ?? path.put;
        modified.requiredCreateFields = operation?.requestBody?.content?.["application/json"]?.schema?.required ?? [];
        modified.openAPIProperties = openAPISpec.data.components.schemas[resource.modelName].properties;
        if (modified.isChild) {
            modified.parentResource = Directory.find(x => x.children?.includes(modified.name));
        }
        return modified;
    });
}

