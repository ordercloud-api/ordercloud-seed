import { Addresses, AdminAddresses, AdminUserGroups, AdminUsers, ApiClients, ApprovalRules, Buyers, Catalogs, Categories, CostCenters, CreditCards, ImpersonationConfigs, Incrementors, IntegrationEvents, MessageSenders, OpenIdConnects, PriceSchedules, ProductFacets, Products, Promotions, SecurityProfiles, Specs, SpendingAccounts, SupplierAddresses, Suppliers, SupplierUserGroups, SupplierUsers, UserGroups, Users, Webhooks, XpIndices } from "ordercloud-javascript-sdk";
import { OCResourceEnum } from "./oc-resource-enum.js";
import { OCResource } from "./oc-resources.js";

export const OCResourceDirectory = [
    { 
        name: OCResourceEnum.SecurityProfiles,
        sdkObject: SecurityProfiles,
    },
    { 
        name: OCResourceEnum.ImpersonationConfigs,
        sdkObject: ImpersonationConfigs,
    },
    {
        name: OCResourceEnum.OpenIdConnects,
        sdkObject: OpenIdConnects
    },
    {
        name: OCResourceEnum.AdminUsers,
        sdkObject: AdminUsers,
    },
    {
        name: OCResourceEnum.AdminUserGroups, 
        sdkObject: AdminUserGroups,
    },
    {
        name: OCResourceEnum.AdminAddresses, 
        sdkObject: AdminAddresses,
    },
    {
        name: OCResourceEnum.MessageSenders,  
        sdkObject: MessageSenders,
    },
    {
        name: OCResourceEnum.ApiClients, 
        sdkObject: ApiClients,
    },
    {
        name: OCResourceEnum.Incrementors,
        sdkObject: Incrementors,
    },
    {
        name: OCResourceEnum.Webhooks, 
        sdkObject: Webhooks,
    },
    {
        name: OCResourceEnum.IntegrationEvents, 
        sdkObject: IntegrationEvents,
    },
    {
        name: OCResourceEnum.XpIndices, 
        sdkObject: XpIndices,
    },
    {
        name: OCResourceEnum.Buyers, 
        sdkObject: Buyers,
        children: [OCResourceEnum.Users, OCResourceEnum.UserGroups, OCResourceEnum.Addresses, OCResourceEnum.CostCenters, OCResourceEnum.CreditCards, OCResourceEnum.SpendingAccounts, OCResourceEnum.ApprovalRules, OCResourceEnum.UserGroupAssignments,     OCResourceEnum.SpendingAccountAssignments, OCResourceEnum.AddressAssignments, OCResourceEnum.CostCenterAssignments, OCResourceEnum.CreditCardAssignments, OCResourceEnum.SpendingAccountAssignments],
    },
    {
        name: OCResourceEnum.Users, 
        sdkObject: Users,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.UserGroups,
        sdkObject: UserGroups,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.Addresses,
        sdkObject: Addresses,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.CostCenters,
        sdkObject: CostCenters,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.CreditCards,
        sdkObject: CreditCards,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.SpendingAccounts,
        sdkObject: SpendingAccounts,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.ApprovalRules,
        sdkObject: ApprovalRules,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.Catalogs, 
        sdkObject: Catalogs,
        children: [OCResourceEnum.Categories, OCResourceEnum.CategoryAssignments, OCResourceEnum.CategoryProductAssignments]
    },
    {
        name: OCResourceEnum.Categories,
        sdkObject: Categories,
        parentRefFieldName: "CatalogID",
        isChild: true,
    },
    {
        name: OCResourceEnum.Suppliers, 
        sdkObject: Suppliers,
        children: [OCResourceEnum.SupplierUsers, OCResourceEnum.SupplierUserGroups, OCResourceEnum.SupplierAddresses, OCResourceEnum.SupplierUserGroupsAssignments]
    },
    {
        name: OCResourceEnum.SupplierUsers, 
        sdkObject: SupplierUsers,
        parentRefFieldName: "SupplierID",
        isChild: true,
    },
    {
        name: OCResourceEnum.SupplierUserGroups, 
        sdkObject: SupplierUserGroups,
        parentRefFieldName: "SupplierID",
        isChild: true,
    },
    {
        name: OCResourceEnum.SupplierAddresses,
        sdkObject: SupplierAddresses,
        parentRefFieldName: "SupplierID",
        isChild: true,
    },
    {
        name: OCResourceEnum.Products, 
        sdkObject: Products,
    },
    {
        name: OCResourceEnum.PriceSchedules, 
        sdkObject: PriceSchedules,
    },
    {
        name: OCResourceEnum.Specs, 
        sdkObject: Specs,
        children: [OCResourceEnum.SpecOptions]
    },
    {
        name: OCResourceEnum.SpecOptions, 
        sdkObject: Specs,
        parentRefFieldName: "SpecID",
        listMethodName: "ListOptions",
        isChild: true
    },
    {
        name: OCResourceEnum.ProductFacets,
        sdkObject: ProductFacets,
    },
    {
        name: OCResourceEnum.Promotions, 
        sdkObject: Promotions,
    },
    {
        name: OCResourceEnum.SecurityProfileAssignments, 
        sdkObject: SecurityProfiles,
        isAssignment: true,
    },
    {
        name: OCResourceEnum.AdminUserGroupAssignments, 
        sdkObject: AdminUserGroups,
        isAssignment: true,
        listMethodName: 'ListUserAssignments'
    },
    {
        name: OCResourceEnum.ApiClientAssignments, 
        sdkObject: ApiClients,
        isAssignment: true,
    },
    {
        name: OCResourceEnum.UserGroupAssignments, 
        sdkObject: UserGroups,
        isAssignment: true,
        parentRefFieldName: "BuyerID",
        isChild: true,
        listMethodName: 'ListUserAssignments'
    },
    {
        name: OCResourceEnum.AddressAssignments, 
        sdkObject: Addresses,
        isAssignment: true,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.CostCenterAssignments, 
        sdkObject: CostCenters,
        isAssignment: true,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.CreditCardAssignments, 
        sdkObject: CreditCards,
        isAssignment: true,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.SpendingAccountAssignments, 
        sdkObject: SpendingAccounts,
        isAssignment: true,
        parentRefFieldName: "BuyerID",
        isChild: true,
    },
    {
        name: OCResourceEnum.SupplierUserGroupsAssignments, 
        sdkObject: SupplierUserGroups,
        isAssignment: true,
        parentRefFieldName: "SupplierID",
        isChild: true,
        listMethodName: 'ListUserAssignments'
    },
    {
        name: OCResourceEnum.ProductAssignments, 
        sdkObject: Products,
        isAssignment: true,
    },
    {
        name: OCResourceEnum.CatalogAssignments,
        sdkObject: Catalogs,
        isAssignment: true,
    },
    {
        name: OCResourceEnum.CatalogProductAssignment, 
        sdkObject: Catalogs,
        isAssignment: true,
        listMethodName: 'ListProductAssignments'
    },
    {
        name: OCResourceEnum.CategoryAssignments, 
        sdkObject: Categories,
        isAssignment: true,
        parentRefFieldName: "CatalogID",
        isChild: true,
    },
    {
        name: OCResourceEnum.CategoryProductAssignments, 
        sdkObject: Categories,
        isAssignment: true,
        parentRefFieldName: "CatalogID",
        isChild: true,
        listMethodName: 'ListProductAssignments'
    },
    {
        name: OCResourceEnum.SpecProductAssignments, 
        sdkObject: Specs,
        isAssignment: true,
        listMethodName: 'ListProductAssignments'
    },
    {
        name: OCResourceEnum.PromotionAssignment, 
        sdkObject: Promotions,
        isAssignment: true,
    },
] as OCResource[];
