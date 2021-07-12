import axios from "axios";
import { isObject } from "lodash";
import { Addresses, AdminAddresses, AdminUserGroups, AdminUsers, ApiClients, ApprovalRules, Buyers, Catalogs, Categories, CostCenters, CreditCards, ImpersonationConfigs, Incrementors, IntegrationEvents, MessageSenders, OpenIdConnects, PriceSchedules, ProductFacets, Products, Promotions, SecurityProfiles, Specs, SpendingAccounts, SupplierAddresses, Suppliers, SupplierUserGroups, SupplierUsers, UserGroups, Users, Webhooks, XpIndices } from "ordercloud-javascript-sdk";
import { OCResourceEnum } from "./oc-resource-enum";
import { OCResource } from "./oc-resources";
import _ from 'lodash';
import { ApiClientValidationFunc, ImpersonationConfigValidationFunc, SecurityProfileAssignmentValidationFunc, WebhookValidationFunc } from "../services/custom-validation-func";

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
        createPriority: 6,
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
        createPriority: 6,
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
        createPriority: 2
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
        createPriority: 5,
        path: "/apiclients",
        redactFields: ["ClientSecret"],
        foreignKeys:
        {
            IntegrationEventID: { foreignResource: OCResourceEnum.IntegrationEvents }
        },
        downloadTransformFunc: (x) => {
            x.ID = x.ID.toLowerCase(); // funky platform thing with API CLient ID casing
            return x;
        },
        customValidationFunc: ApiClientValidationFunc, 
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
        createPriority: 6,
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
        createPriority: 3,
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
        createPriority: 4,
        parentRefField: "BuyerID",
        path: "/buyers/{buyerID}/users",
        isChild: true,
    },
    {
        name: OCResourceEnum.UserGroups,
        modelName: "UserGroup",
        sdkObject: UserGroups,
        createPriority: 4,
        parentRefField: "BuyerID",
        path: "/buyers/{buyerID}/usergroups",
        isChild: true,
    },
    {
        name: OCResourceEnum.Addresses,
        modelName: "Address",
        sdkObject: Addresses,
        createPriority: 4,
        parentRefField: "BuyerID",
        path: "/buyers/{buyerID}/addresses",
        isChild: true,
    },
    {
        name: OCResourceEnum.CostCenters,
        modelName: "CostCenter",
        sdkObject: CostCenters,
        createPriority: 4,
        parentRefField: "BuyerID",
        path: "/buyers/{buyerID}/costcenters",
        isChild: true,
    },
    {
        name: OCResourceEnum.CreditCards,
        modelName: "CreditCard",
        sdkObject: CreditCards,
        createPriority: 4,
        parentRefField: "BuyerID",
        path: "/buyers/{buyerID}/creditcards",
        isChild: true,
    },
    {
        name: OCResourceEnum.SpendingAccounts,
        modelName: "SpendingAccount",
        sdkObject: SpendingAccounts,
        createPriority: 4,
        parentRefField: "BuyerID",
        path: "/buyers/{buyerID}/spendingaccounts",
        isChild: true,
    },
    {
        name: OCResourceEnum.ApprovalRules,
        modelName:"ApprovalRule",
        sdkObject: ApprovalRules,
        createPriority: 5,
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
        createPriority: 2,
        path: "/catalogs",
        hasOwnerIDField: true,
        children: [OCResourceEnum.Categories, OCResourceEnum.CategoryAssignments, OCResourceEnum.CategoryProductAssignments]
    },
    {
        name: OCResourceEnum.Categories,
        modelName: "Category",
        sdkObject: Categories,
        createPriority: 3,
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
        children: [OCResourceEnum.SupplierUsers, OCResourceEnum.SupplierUserGroups, OCResourceEnum.SupplierAddresses, OCResourceEnum.SupplierUserGroupsAssignments]
    },
    {
        name: OCResourceEnum.SupplierUsers, 
        modelName: "User",
        sdkObject: SupplierUsers,
        createPriority: 3,
        parentRefField: "SupplierID",
        path: "/suppliers/{supplierID}/users",
        isChild: true,
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
        hasOwnerIDField: true,
        foreignKeys: {
            DefaultPriceScheduleID: { foreignResource: OCResourceEnum.PriceSchedules },
            ShipFromAddressID: { foreignResource: OCResourceEnum.AdminAddresses },
            DefaultSupplierID: { foreignResource: OCResourceEnum.Suppliers }
        }
    },
    {
        name: OCResourceEnum.PriceSchedules, 
        modelName: "PriceSchedule",
        sdkObject: PriceSchedules,
        path: "/priceschedules",
        createPriority: 2,
        hasOwnerIDField: true,
    },
    {
        name: OCResourceEnum.Specs, 
        modelName: "Spec",
        sdkObject: Specs,
        createPriority: 2,
        path: "/specs",
        hasOwnerIDField: true,
        foreignKeys: {
            DefaultOptionID: { foreignResource: OCResourceEnum.SpecOptions, foreignParentRefField: "ID" },
        },
        children: [OCResourceEnum.SpecOptions]
    },
    {
        name: OCResourceEnum.SpecOptions, 
        modelName: "SpecOption",
        sdkObject: Specs,
        createPriority: 3,
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
        createPriority: 2,
        hasOwnerIDField: true
    },
    {
        name: OCResourceEnum.SecurityProfileAssignments, 
        modelName: "SecurityProfileAssignment",
        sdkObject: SecurityProfiles,
        path: "/securityprofiles/assignments",
        createPriority: 5,
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
        createPriority: 6,
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
        name: OCResourceEnum.UserGroupAssignments, 
        modelName: "UserGroupAssignment",
        sdkObject: UserGroups,
        createPriority: 5,
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
        createPriority: 5,
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
        createPriority: 5,
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
        createPriority: 5,
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
        createPriority: 5,
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
        createPriority: 4,
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
        createPriority: 5,
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
        createPriority: 5,
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
    resource.hasOwnerIDField = resource.hasOwnerIDField ?? false;
    return resource;
}

export async function BuildResourceDirectory(includeOpenAPI: boolean = false): Promise<OCResource[]> {
    var openAPISpec;
    if (includeOpenAPI) {
        openAPISpec = await axios.get(`https://api.ordercloud.io/v1/openapi/v3`) 
    }
    return Directory.map(resource => {  
        var modified = ApplyDefaults(resource);
        if (includeOpenAPI) {
            var path = openAPISpec.data.paths[resource.path];
            var operation = path.post ?? path.put;
            modified.requiredCreateFields = operation.requestBody.content?.["application/json"]?.schema?.required ?? [];
            modified.openAPIProperties = openAPISpec.data.components.schemas[resource.modelName].properties;
            if (modified.isChild) {
                modified.parentResource = Directory.find(x => x.children.includes(modified.name));
            }
        }
        return modified;
    });
}

