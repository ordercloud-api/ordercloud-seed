import { Addresses, AdminAddresses, AdminUserGroups, AdminUsers, ApiClients, ApprovalRules, Buyers, Catalogs, Categories, CostCenters, CreditCards, ImpersonationConfigs, Incrementors, IntegrationEvents, MessageSenders, OpenIdConnects, PriceSchedules, ProductFacets, Products, Promotions, SecurityProfiles, Specs, SpendingAccounts, SupplierAddresses, Suppliers, SupplierUserGroups, SupplierUsers, UserGroups, Users, Webhooks, XpIndices } from "ordercloud-javascript-sdk";
import { OCResourceEnum } from "./oc-resource-enum.js";
import { OCResource } from "./oc-resources.js";

export const OCResourceDirectory: OCResource[] = [
    { 
        name: OCResourceEnum.SecurityProfiles,
        sdkObject: SecurityProfiles,
        createPriority: 2,
    },
    { 
        name: OCResourceEnum.ImpersonationConfigs,
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
        sdkObject: AdminUsers,
        createPriority: 2
    },
    {
        name: OCResourceEnum.AdminUserGroups, 
        sdkObject: AdminUserGroups,
        createPriority: 2
    },
    {
        name: OCResourceEnum.AdminAddresses, 
        sdkObject: AdminAddresses,
        createPriority: 2
    },
    {
        name: OCResourceEnum.MessageSenders,  
        sdkObject: MessageSenders,
        createPriority: 2
    },
    {
        name: OCResourceEnum.ApiClients, 
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
        sdkObject: Incrementors,
        createPriority: 1
    },
    {
        name: OCResourceEnum.Webhooks, 
        sdkObject: Webhooks,
        createPriority: 6,
        foreignKeys:
        {
            ApiClientIDs:  (a,b) => false, // todo. validate list
        }
    },
    {
        name: OCResourceEnum.IntegrationEvents, 
        sdkObject: IntegrationEvents,
        createPriority: 2
    },
    {
        name: OCResourceEnum.XpIndices, 
        sdkObject: XpIndices,
        createPriority: 1
    },
    {
        name: OCResourceEnum.Buyers, 
        sdkObject: Buyers,
        createPriority: 3,
        foreignKeys:
        {
            DefaultCatalogID: OCResourceEnum.Catalogs
        },
        children: [OCResourceEnum.Users, OCResourceEnum.UserGroups, OCResourceEnum.Addresses, OCResourceEnum.CostCenters, OCResourceEnum.CreditCards, OCResourceEnum.SpendingAccounts, OCResourceEnum.ApprovalRules, OCResourceEnum.UserGroupAssignments,     OCResourceEnum.SpendingAccountAssignments, OCResourceEnum.AddressAssignments, OCResourceEnum.CostCenterAssignments, OCResourceEnum.CreditCardAssignments, OCResourceEnum.SpendingAccountAssignments],
    },
    {
        name: OCResourceEnum.Users, 
        sdkObject: Users,
        createPriority: 4,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.UserGroups,
        sdkObject: UserGroups,
        createPriority: 4,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.Addresses,
        sdkObject: Addresses,
        createPriority: 4,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.CostCenters,
        sdkObject: CostCenters,
        createPriority: 4,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.CreditCards,
        sdkObject: CreditCards,
        createPriority: 4,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.SpendingAccounts,
        sdkObject: SpendingAccounts,
        createPriority: 4,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.ApprovalRules,
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
        sdkObject: Catalogs,
        createPriority: 2,
        children: [OCResourceEnum.Categories, OCResourceEnum.CategoryAssignments, OCResourceEnum.CategoryProductAssignments]
    },
    {
        name: OCResourceEnum.Categories,
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
        sdkObject: Suppliers,
        createPriority: 2,
        children: [OCResourceEnum.SupplierUsers, OCResourceEnum.SupplierUserGroups, OCResourceEnum.SupplierAddresses, OCResourceEnum.SupplierUserGroupsAssignments]
    },
    {
        name: OCResourceEnum.SupplierUsers, 
        sdkObject: SupplierUsers,
        createPriority: 3,
        parentRefFieldName: "SupplierID",
        isChild: true,
    },
    {
        name: OCResourceEnum.SupplierUserGroups, 
        sdkObject: SupplierUserGroups,
        createPriority: 3,
        parentRefFieldName: "SupplierID",
        isChild: true,
    },
    {
        name: OCResourceEnum.SupplierAddresses,
        sdkObject: SupplierAddresses,
        createPriority: 3,
        parentRefFieldName: "SupplierID",
        isChild: true,
    },
    {
        name: OCResourceEnum.Products, 
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
        sdkObject: PriceSchedules,
        createPriority: 2
    },
    {
        name: OCResourceEnum.Specs, 
        sdkObject: Specs,
        createPriority: 2,
        foreignKeys: {
            DefaultOptionID: OCResourceEnum.SpecOptions,
        },
        children: [OCResourceEnum.SpecOptions]
    },
    {
        name: OCResourceEnum.SpecOptions, 
        sdkObject: Specs,
        createPriority: 3,
        parentRefFieldName: "SpecID",
        listMethodName: "ListOptions",
        isChild: true
    },
    {
        name: OCResourceEnum.ProductFacets,
        sdkObject: ProductFacets,
        createPriority: 2
    },
    {
        name: OCResourceEnum.Promotions, 
        sdkObject: Promotions,
        createPriority: 2
    },
    {
        name: OCResourceEnum.SecurityProfileAssignments, 
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
        sdkObject: Products,
        createPriority: 5,
        isAssignment: true,
        foreignKeys: {
            ProductID: OCResourceEnum.Products,
            BuyerID: OCResourceEnum.Buyers,
            UserGroupID: OCResourceEnum.SupplierUserGroups,
            PriceSchedules: OCResourceEnum.PriceSchedules
        },
    },
    {
        name: OCResourceEnum.CatalogAssignments,
        sdkObject: Catalogs,
        createPriority: 4,
        isAssignment: true,
        foreignKeys: {
            CatalogID: OCResourceEnum.Catalogs,
            BuyerID: OCResourceEnum.Buyers
        },
    },
    {
        name: OCResourceEnum.CatalogProductAssignment, 
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
        sdkObject: Promotions,
        createPriority: 5,
        isAssignment: true,
        foreignKeys: {
            PromotionID: OCResourceEnum.PromotionAssignment,
            BuyerID: OCResourceEnum.Buyers,
            UserGroupID: OCResourceEnum.UserGroups,
        },
    },
]
