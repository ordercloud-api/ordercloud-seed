import { Addresses, AdminAddresses, AdminUserGroups, AdminUsers, ApiClients, ApprovalRules, Buyers, Catalogs, Categories, CostCenters, CreditCards, ImpersonationConfigs, Incrementors, IntegrationEvents, MessageSenders, OpenIdConnects, PriceSchedules, ProductFacets, Products, Promotions, SecurityProfiles, Specs, SpendingAccounts, SupplierAddresses, Suppliers, SupplierUserGroups, SupplierUsers, UserGroups, Users, Webhooks, XpIndices } from "ordercloud-javascript-sdk";
import { OCResourceEnum } from "./oc-resource-enum.js";
import { OCResource } from "./oc-resources.js";

export const OCResourceDirectory: OCResource[] = [
    { 
        name: OCResourceEnum.SecurityProfiles,
        sdkObject: SecurityProfiles,
        createPriority: 2
    },
    { 
        name: OCResourceEnum.ImpersonationConfigs,
        sdkObject: ImpersonationConfigs,
        createPriority: 5
    },
    {
        name: OCResourceEnum.OpenIdConnects,
        sdkObject: OpenIdConnects,
        createPriority: 6
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
        createPriority: 5
    },
    {
        name: OCResourceEnum.Incrementors,
        sdkObject: Incrementors,
        createPriority: 1
    },
    {
        name: OCResourceEnum.Webhooks, 
        sdkObject: Webhooks,
        createPriority: 6
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
        createPriority: 4
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
    },
    {
        name: OCResourceEnum.AdminUserGroupAssignments, 
        sdkObject: AdminUserGroups,
        createPriority: 3,
        isAssignment: true,
        listMethodName: 'ListUserAssignments'
    },
    {
        name: OCResourceEnum.ApiClientAssignments, 
        sdkObject: ApiClients,
        createPriority: 6,
        isAssignment: true,
    },
    {
        name: OCResourceEnum.UserGroupAssignments, 
        sdkObject: UserGroups,
        createPriority: 5,
        isAssignment: true,
        parentRefFieldName: "BuyerID",
        isChild: true,
        listMethodName: 'ListUserAssignments'
    },
    {
        name: OCResourceEnum.AddressAssignments, 
        sdkObject: Addresses,
        createPriority: 5,
        isAssignment: true,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.CostCenterAssignments, 
        sdkObject: CostCenters,
        createPriority: 5,
        isAssignment: true,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.CreditCardAssignments, 
        sdkObject: CreditCards,
        createPriority: 5,
        isAssignment: true,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.SpendingAccountAssignments, 
        sdkObject: SpendingAccounts,
        createPriority: 5,
        isAssignment: true,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.SupplierUserGroupsAssignments, 
        sdkObject: SupplierUserGroups,
        createPriority: 4,
        isAssignment: true,
        parentRefFieldName: "SupplierID",
        isChild: true,
        listMethodName: 'ListUserAssignments'
    },
    {
        name: OCResourceEnum.ProductAssignments, 
        sdkObject: Products,
        createPriority: 5,
        isAssignment: true,
    },
    {
        name: OCResourceEnum.CatalogAssignments,
        sdkObject: Catalogs,
        createPriority: 4,
        isAssignment: true,
    },
    {
        name: OCResourceEnum.CatalogProductAssignment, 
        sdkObject: Catalogs,
        createPriority: 5,
        isAssignment: true,
        listMethodName: 'ListProductAssignments'
    },
    {
        name: OCResourceEnum.CategoryAssignments, 
        sdkObject: Categories,
        createPriority: 5,
        isAssignment: true,
        parentRefFieldName: "CatalogID",
        isChild: true,
    },
    {
        name: OCResourceEnum.CategoryProductAssignments, 
        sdkObject: Categories,
        createPriority: 5,
        isAssignment: true,
        parentRefFieldName: "CatalogID",
        isChild: true,
        listMethodName: 'ListProductAssignments'
    },
    {
        name: OCResourceEnum.SpecProductAssignments, 
        sdkObject: Specs,
        createPriority: 5,
        isAssignment: true,
        listMethodName: 'ListProductAssignments'
    },
    {
        name: OCResourceEnum.PromotionAssignment, 
        sdkObject: Promotions,
        createPriority: 5,
        isAssignment: true,
    },
]
