import axios from "axios";
import { Addresses, AdminAddresses, AdminUserGroups, AdminUsers, ApiClients, ApprovalRules, Buyers, Catalogs, Categories, CostCenters, CreditCards, ImpersonationConfigs, Incrementors, IntegrationEvents, MessageSenders, OpenIdConnects, PriceSchedules, ProductFacets, Products, Promotions, SecurityProfiles, Specs, SpendingAccounts, SupplierAddresses, Suppliers, SupplierUserGroups, SupplierUsers, UserGroups, Users, Webhooks, XpIndices } from "ordercloud-javascript-sdk";
import { OCResourceEnum } from "./oc-resource-enum";
import { OCResource } from "./oc-resources";

const Directory: OCResource[] = [
    { 
        name: OCResourceEnum.SecurityProfiles,
        modelName: 'SecurityProfile',
        sdkObject: SecurityProfiles,
        createPriority: 2,
    },
    { 
        name: OCResourceEnum.ImpersonationConfigs,
        modelName: 'ImpersonationConfig',
        sdkObject: ImpersonationConfigs,
        createPriority: 6,
        foreignKeys: {
            ClientID: OCResourceEnum.ApiClients,
            SecurityProfileID: OCResourceEnum.SecurityProfiles,
            BuyerID: OCResourceEnum.Buyers,
            GroupID: OCResourceEnum.UserGroups,
            UserID: OCResourceEnum.Users,
            ImpersonationBuyerID: OCResourceEnum.Buyers,
            ImpersonationGroupID: (a,b) => false, // todo. I think this could be an admin or buyer user group
            ImpersonationUserID: (a,b,) => false // todo. I think this could be an admin or buyer user
        }
    },
    {
        name: OCResourceEnum.OpenIdConnects,
        modelName: 'OpenIdConnect',
        sdkObject: OpenIdConnects,
        createPriority: 6,
        foreignKeys: 
        {
            OrderCloudApiClientID: OCResourceEnum.ApiClients,
            IntegrationEventID: OCResourceEnum.IntegrationEvents
        }
    },
    {
        name: OCResourceEnum.AdminUsers,
        modelName: 'User',
        sdkObject: AdminUsers,
        createPriority: 2
    },
    {
        name: OCResourceEnum.AdminUserGroups, 
        modelName: 'UserGroup',
        sdkObject: AdminUserGroups,
        createPriority: 2
    },
    {
        name: OCResourceEnum.AdminAddresses, 
        modelName: 'Address',
        sdkObject: AdminAddresses,
        createPriority: 2
    },
    {
        name: OCResourceEnum.MessageSenders,  
        modelName: 'MessageSender',
        sdkObject: MessageSenders,
        createPriority: 2
    },
    {
        name: OCResourceEnum.ApiClients, 
        modelName: 'ApiClient',
        sdkObject: ApiClients,
        createPriority: 5,
        foreignKeys:
        {
            IntegrationEventID: OCResourceEnum.IntegrationEvents,
            DefaultContextUserName: (a,b) => false, // todo. Look for usernames 
        },
    },
    {
        name: OCResourceEnum.Incrementors,
        modelName: 'Incrementor',
        sdkObject: Incrementors,
        createPriority: 1
    },
    {
        name: OCResourceEnum.Webhooks, 
        modelName: 'Webhook',
        sdkObject: Webhooks,
        createPriority: 6,
        foreignKeys:
        {
            ApiClientIDs:  (a,b) => false, // todo. validate list
        }
    },
    {
        name: OCResourceEnum.IntegrationEvents, 
        modelName: 'IntegrationEvent',
        sdkObject: IntegrationEvents,
        createPriority: 2
    },
    {
        name: OCResourceEnum.XpIndices, 
        modelName: "XpIndex",
        sdkObject: XpIndices,
        createPriority: 1
    },
    {
        name: OCResourceEnum.Buyers, 
        modelName: "Buyer",
        sdkObject: Buyers,
        createPriority: 3,
        foreignKeys:
        {
            DefaultCatalogID: OCResourceEnum.Catalogs
        },
        children: [OCResourceEnum.Users, OCResourceEnum.UserGroups, OCResourceEnum.Addresses, OCResourceEnum.CostCenters, OCResourceEnum.CreditCards, OCResourceEnum.SpendingAccounts, OCResourceEnum.ApprovalRules, OCResourceEnum.UserGroupAssignments, OCResourceEnum.SpendingAccountAssignments, OCResourceEnum.AddressAssignments, OCResourceEnum.CostCenterAssignments, OCResourceEnum.CreditCardAssignments, OCResourceEnum.SpendingAccountAssignments],
    },
    {
        name: OCResourceEnum.Users, 
        modelName: "User",
        sdkObject: Users,
        createPriority: 4,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.UserGroups,
        modelName: "UserGroup",
        sdkObject: UserGroups,
        createPriority: 4,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.Addresses,
        modelName: "Address",
        sdkObject: Addresses,
        createPriority: 4,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.CostCenters,
        modelName: "CostCenter",
        sdkObject: CostCenters,
        createPriority: 4,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.CreditCards,
        modelName: "CreditCard",
        sdkObject: CreditCards,
        createPriority: 4,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.SpendingAccounts,
        modelName: "SpendingAccount",
        sdkObject: SpendingAccounts,
        createPriority: 4,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.ApprovalRules,
        modelName:"ApprovalRule",
        sdkObject: ApprovalRules,
        createPriority: 5,
        parentRefFieldName: "BuyerID",
        isChild: true,
        foreignKeys: {
            ApprovingGroupID: (a,b) => false // todo - can this be a buyer or admin group?
        }
    },
    {
        name: OCResourceEnum.Catalogs, 
        modelName: "Catalog",
        sdkObject: Catalogs,
        createPriority: 2,
        children: [OCResourceEnum.Categories, OCResourceEnum.CategoryAssignments, OCResourceEnum.CategoryProductAssignments]
    },
    {
        name: OCResourceEnum.Categories,
        modelName: "Category",
        sdkObject: Categories,
        createPriority: 3,
        parentRefFieldName: "CatalogID",
        isChild: true,
        foreignKeys: {
            ParentID: OCResourceEnum.Categories
        }
    },
    {
        name: OCResourceEnum.Suppliers, 
        modelName: "Supplier",
        sdkObject: Suppliers,
        createPriority: 2,
        children: [OCResourceEnum.SupplierUsers, OCResourceEnum.SupplierUserGroups, OCResourceEnum.SupplierAddresses, OCResourceEnum.SupplierUserGroupsAssignments]
    },
    {
        name: OCResourceEnum.SupplierUsers, 
        modelName: "User",
        sdkObject: SupplierUsers,
        createPriority: 3,
        parentRefFieldName: "SupplierID",
        isChild: true,
    },
    {
        name: OCResourceEnum.SupplierUserGroups, 
        modelName: "UserGroup",
        sdkObject: SupplierUserGroups,
        createPriority: 3,
        parentRefFieldName: "SupplierID",
        isChild: true,
    },
    {
        name: OCResourceEnum.SupplierAddresses,
        modelName: "Address",
        sdkObject: SupplierAddresses,
        createPriority: 3,
        parentRefFieldName: "SupplierID",
        isChild: true,
    },
    {
        name: OCResourceEnum.Products, 
        modelName: "Product",
        sdkObject: Products,
        createPriority: 4,
        foreignKeys: {
            DefaultPriceScheduleID: OCResourceEnum.PriceSchedules,
            ShipFromAddressID: (a,b) => false, // todo. can be admin or supplier address. 
            DefaultSupplierID: OCResourceEnum.Suppliers
        }
    },
    {
        name: OCResourceEnum.PriceSchedules, 
        modelName: "PriceSchedule",
        sdkObject: PriceSchedules,
        createPriority: 2
    },
    {
        name: OCResourceEnum.Specs, 
        modelName: "Spec",
        sdkObject: Specs,
        createPriority: 2,
        foreignKeys: {
            DefaultOptionID: OCResourceEnum.SpecOptions,
        },
        children: [OCResourceEnum.SpecOptions]
    },
    {
        name: OCResourceEnum.SpecOptions, 
        modelName: "SpecOption",
        sdkObject: Specs,
        createPriority: 3,
        parentRefFieldName: "SpecID",
        listMethodName: "ListOptions",
        isChild: true
    },
    {
        name: OCResourceEnum.ProductFacets,
        modelName: "ProductFacet",
        sdkObject: ProductFacets,
        createPriority: 2
    },
    {
        name: OCResourceEnum.Promotions, 
        modelName: "Promotion",
        sdkObject: Promotions,
        createPriority: 2
    },
    {
        name: OCResourceEnum.SecurityProfileAssignments, 
        modelName: "SecurityProfileAssignment",
        sdkObject: SecurityProfiles,
        createPriority: 5,
        isAssignment: true,
        foreignKeys: {
            SecurityProfileID: OCResourceEnum.SecurityProfiles,
            BuyerID: OCResourceEnum.Buyers,
            SupplierID: OCResourceEnum.Suppliers,
            UserID: (a,b) => false, // todo. Could be any user type
            UserGroupID: (a,b) => false // todo. Could be any user group type
        },
    },
    {
        name: OCResourceEnum.AdminUserGroupAssignments, 
        modelName: "UserGroupAssignment",
        sdkObject: AdminUserGroups,
        createPriority: 3,
        isAssignment: true,
        listMethodName: 'ListUserAssignments',
        foreignKeys: {
            UserID: OCResourceEnum.AdminUsers,
            UserGroupID: OCResourceEnum.AdminUserGroups,
        },
    },
    {
        name: OCResourceEnum.ApiClientAssignments, 
        modelName: "ApiClientAssignment",
        sdkObject: ApiClients,
        createPriority: 6,
        isAssignment: true,
        foreignKeys: {
            ApiClientID: OCResourceEnum.ApiClients,
            BuyerID: OCResourceEnum.Buyers,
            SupplierID: OCResourceEnum.Suppliers,
        },
    },
    {
        name: OCResourceEnum.UserGroupAssignments, 
        modelName: "UserGroupAssignment",
        sdkObject: UserGroups,
        createPriority: 5,
        isAssignment: true,
        parentRefFieldName: "BuyerID",
        isChild: true,
        listMethodName: 'ListUserAssignments',
        foreignKeys: {
            UserID: OCResourceEnum.Users,
            UserGroupID: OCResourceEnum.UserGroups,
        },
    },
    {
        name: OCResourceEnum.AddressAssignments, 
        modelName: "AddressAssignment",
        sdkObject: Addresses,
        createPriority: 5,
        isAssignment: true,
        parentRefFieldName: "BuyerID",
        isChild: true,
        foreignKeys: {
            AddressID: OCResourceEnum.Addresses,
            UserID: OCResourceEnum.Users,
            UserGroupID: OCResourceEnum.UserGroups,
        },
    },
    {
        name: OCResourceEnum.CostCenterAssignments, 
        modelName: "CostCenterAssignment",
        sdkObject: CostCenters,
        createPriority: 5,
        isAssignment: true,
        parentRefFieldName: "BuyerID",
        isChild: true,
        foreignKeys: {
            CostCenterID: OCResourceEnum.CostCenters,
            UserGroupID: OCResourceEnum.UserGroups,
        },
    },
    {
        name: OCResourceEnum.CreditCardAssignments, 
        modelName: "CreditCardAssignment",
        sdkObject: CreditCards,
        createPriority: 5,
        isAssignment: true,
        parentRefFieldName: "BuyerID",
        isChild: true,
        foreignKeys: {
            CreditCardID: OCResourceEnum.Addresses,
            UserID: OCResourceEnum.Users,
            UserGroupID: OCResourceEnum.UserGroups,
        },
    },
    {
        name: OCResourceEnum.SpendingAccountAssignments, 
        modelName: "SpendingAccountAssignment",
        sdkObject: SpendingAccounts,
        createPriority: 5,
        isAssignment: true,
        parentRefFieldName: "BuyerID",
        isChild: true,
        foreignKeys: {
            SpendingAccountID: OCResourceEnum.SpendingAccounts,
            UserID: OCResourceEnum.Users,
            UserGroupID: OCResourceEnum.UserGroups,
        },
    },
    {
        name: OCResourceEnum.SupplierUserGroupsAssignments, 
        modelName: "UserGroupAssignment",
        sdkObject: SupplierUserGroups,
        createPriority: 4,
        isAssignment: true,
        parentRefFieldName: "SupplierID",
        isChild: true,
        listMethodName: 'ListUserAssignments',
        foreignKeys: {
            UserID: OCResourceEnum.SupplierUsers,
            UserGroupID: OCResourceEnum.SupplierUserGroups,
        },
    },
    {
        name: OCResourceEnum.ProductAssignments, 
        modelName: "ProductAssignment",
        sdkObject: Products,
        createPriority: 5,
        isAssignment: true,
        foreignKeys: {
            ProductID: OCResourceEnum.Products,
            BuyerID: OCResourceEnum.Buyers,
            UserGroupID: OCResourceEnum.SupplierUserGroups,
            PriceScheduleID: OCResourceEnum.PriceSchedules
        },
    },
    {
        name: OCResourceEnum.CatalogAssignments,
        modelName: "CatalogAssignment",
        sdkObject: Catalogs,
        createPriority: 4,
        isAssignment: true,
        foreignKeys: {
            CatalogID: OCResourceEnum.Catalogs,
            BuyerID: OCResourceEnum.Buyers
        },
    },
    {
        name: OCResourceEnum.ProductCatalogAssignment, 
        modelName: "ProductCatalogAssignment",
        sdkObject: Catalogs,
        createPriority: 5,
        isAssignment: true,
        listMethodName: 'ListProductAssignments',
        foreignKeys: {
            CatalogID: OCResourceEnum.Catalogs,
            ProductID: OCResourceEnum.Products
        },
    },
    {
        name: OCResourceEnum.CategoryAssignments, 
        modelName: "CategoryAssignment",
        sdkObject: Categories,
        createPriority: 5,
        isAssignment: true,
        parentRefFieldName: "CatalogID",
        isChild: true,
        foreignKeys: {
            CategoryID: OCResourceEnum.Categories,
            UserID: OCResourceEnum.Users,
            UserGroupID: OCResourceEnum.UserGroups,
        },
    },
    {
        name: OCResourceEnum.CategoryProductAssignments, 
        modelName: "CategoryProductAssignment",
        sdkObject: Categories,
        createPriority: 5,
        isAssignment: true,
        parentRefFieldName: "CatalogID",
        isChild: true,
        listMethodName: 'ListProductAssignments',
        foreignKeys: {
            CategoryID: OCResourceEnum.Categories,
            ProductID: OCResourceEnum.Products,
        },
    },
    {
        name: OCResourceEnum.SpecProductAssignments, 
        modelName: "SpecProductAssignment",
        sdkObject: Specs,
        createPriority: 5,
        isAssignment: true,
        listMethodName: 'ListProductAssignments',
        foreignKeys: {
            SpecID: OCResourceEnum.Specs,
            ProductID: OCResourceEnum.Products,
            DefaultOptionID: OCResourceEnum.SpecOptions,
        },
    },
    {
        name: OCResourceEnum.PromotionAssignment, 
        modelName: "PromotionAssignment",
        sdkObject: Promotions,
        createPriority: 5,
        isAssignment: true,
        foreignKeys: {
            PromotionID: OCResourceEnum.PromotionAssignment,
            BuyerID: OCResourceEnum.Buyers,
            UserGroupID: OCResourceEnum.UserGroups,
        },
    },
];

function ApplyDefaults(resource: OCResource): OCResource {
    resource.isAssignment = resource.isAssignment || false;
    resource.listMethodName = resource.listMethodName || (resource.isAssignment ? "ListAssignments" : "List");
    resource.createMethodName = resource.createMethodName || (resource.isAssignment ? "CreateAssignment" : "Create");
    resource.foreignKeys = resource.foreignKeys || {};
    resource.children = resource.children || [];
    resource.isChild = resource.isChild || false;
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
            modified.openAPIProperties = openAPISpec.data.components.schemas[resource.modelName].properties;
        }
        return modified;
    });
}

