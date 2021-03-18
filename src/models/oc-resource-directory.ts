import { Addresses, AdminAddresses, AdminUserGroups, AdminUsers, ApiClients, ApprovalRules, Buyers, Catalogs, Categories, CostCenters, CreditCards, ImpersonationConfigs, Incrementors, IntegrationEvents, MessageSenders, OpenIdConnects, PriceSchedules, ProductFacets, Products, Promotions, SecurityProfiles, Specs, SpendingAccounts, SupplierAddresses, Suppliers, SupplierUserGroups, SupplierUsers, UserGroups, Users, Webhooks, XpIndices } from "ordercloud-javascript-sdk";
import { OCResourceEnum } from "./oc-resource-enum.js";
import { OCResource } from "./oc-resources.js";

export const OCResourceDirectory = new Map<OCResourceEnum, OCResource>([
    [OCResourceEnum.SecurityProfiles, new OCResource({ 
        sdkObject: SecurityProfiles,
    })],
    [OCResourceEnum.ImpersonationConfigs, new OCResource({ 
        sdkObject: ImpersonationConfigs,
    })],
    [OCResourceEnum.OpenIdConnects, new OCResource({ 
        sdkObject: OpenIdConnects,
    })],
    [OCResourceEnum.AdminUsers, new OCResource({ 
        sdkObject: AdminUsers,
    })],
    [OCResourceEnum.AdminUserGroups, new OCResource({ 
        sdkObject: AdminUserGroups,
    })],
    [OCResourceEnum.AdminAddresses, new OCResource({ 
        sdkObject: AdminAddresses,
    })],
    [OCResourceEnum.MessageSenders, new OCResource({ 
        sdkObject: MessageSenders,
    })],
    [OCResourceEnum.ApiClients, new OCResource({ 
        sdkObject: ApiClients,
    })],
    [OCResourceEnum.Incrementors, new OCResource({ 
        sdkObject: Incrementors,
    })],
    [OCResourceEnum.Webhooks, new OCResource({ 
        sdkObject: Webhooks,
    })],
    [OCResourceEnum.IntegrationEvents, new OCResource({ 
        sdkObject: IntegrationEvents,
    })],
    [OCResourceEnum.XpIndices, new OCResource({ 
        sdkObject: XpIndices,
    })],
    [OCResourceEnum.Buyers, new OCResource({ 
        sdkObject: Buyers,
        children: [OCResourceEnum.Users, OCResourceEnum.UserGroups, OCResourceEnum.Addresses, OCResourceEnum.CostCenters, OCResourceEnum.CreditCards, OCResourceEnum.SpendingAccounts, OCResourceEnum.ApprovalRules, OCResourceEnum.UserGroupAssignments,     OCResourceEnum.SpendingAccountAssignments, OCResourceEnum.AddressAssignments, OCResourceEnum.CostCenterAssignments, OCResourceEnum.CreditCardAssignments, OCResourceEnum.SpendingAccountAssignments],
    })],
    [OCResourceEnum.Users, new OCResource({ 
        sdkObject: Users,
        parentRefFieldName: "BuyerID",
        isChild: true,
    })],
    [OCResourceEnum.UserGroups, new OCResource({ 
        sdkObject: UserGroups,
        parentRefFieldName: "BuyerID",
        isChild: true,
    })],
    [OCResourceEnum.Addresses, new OCResource({ 
        sdkObject: Addresses,
        parentRefFieldName: "BuyerID",
        isChild: true,
    })],
    [OCResourceEnum.CostCenters, new OCResource({ 
        sdkObject: CostCenters,
        parentRefFieldName: "BuyerID",
        isChild: true,
    })],
    [OCResourceEnum.CreditCards, new OCResource({ 
        sdkObject: CreditCards,
        parentRefFieldName: "BuyerID",
        isChild: true,
    })],
    [OCResourceEnum.SpendingAccounts, new OCResource({ 
        sdkObject: SpendingAccounts,
        parentRefFieldName: "BuyerID",
        isChild: true,
    })],
    [OCResourceEnum.ApprovalRules, new OCResource({ 
        sdkObject: ApprovalRules,
        parentRefFieldName: "BuyerID",
        isChild: true,
    })],
    [OCResourceEnum.Catalogs, new OCResource({ 
        sdkObject: Catalogs,
        children: [OCResourceEnum.Categories, OCResourceEnum.CategoryAssignments, OCResourceEnum.CategoryProductAssignments]
    })],
    [OCResourceEnum.Categories, new OCResource({ 
        sdkObject: Categories,
        parentRefFieldName: "CatalogID",
        isChild: true,
    })],
    [OCResourceEnum.Suppliers, new OCResource({ 
        sdkObject: Suppliers,
        children: [OCResourceEnum.SupplierUsers, OCResourceEnum.SupplierUserGroups, OCResourceEnum.SupplierAddresses, OCResourceEnum.SupplierUserGroupsAssignments]
    })],
    [OCResourceEnum.SupplierUsers, new OCResource({ 
        sdkObject: SupplierUsers,
        parentRefFieldName: "SupplierID",
        isChild: true,
    })],
    [OCResourceEnum.SupplierUserGroups, new OCResource({ 
        sdkObject: SupplierUserGroups,
        parentRefFieldName: "SupplierID",
        isChild: true,
    })],
    [OCResourceEnum.SupplierAddresses, new OCResource({ 
        sdkObject: SupplierAddresses,
        parentRefFieldName: "SupplierID",
        isChild: true,
    })],
    [OCResourceEnum.Products, new OCResource({ 
        sdkObject: Products,
    })],
    [OCResourceEnum.PriceSchedules, new OCResource({ 
        sdkObject: PriceSchedules,
    })],
    [OCResourceEnum.Specs, new OCResource({ 
        sdkObject: Specs,
        children: [OCResourceEnum.SpecOptions]
    })],
    [OCResourceEnum.SpecOptions, new OCResource({ 
        sdkObject: Specs,
        parentRefFieldName: "SpecID",
        listMethodName: "ListOptions",
        isChild: true
    })],
    [OCResourceEnum.ProductFacets, new OCResource({ 
        sdkObject: ProductFacets,
    })],
    [OCResourceEnum.Promotions, new OCResource({ 
        sdkObject: Promotions,
    })],
    [OCResourceEnum.SecurityProfileAssignments, new OCResource({ 
        sdkObject: SecurityProfiles,
        isAssignment: true,
    })],
    [OCResourceEnum.AdminUserGroupAssignments, new OCResource({ 
        sdkObject: AdminUserGroups,
        isAssignment: true,
        listMethodName: 'ListUserAssignments'
    })],
    [OCResourceEnum.ApiClientAssignments, new OCResource({ 
        sdkObject: ApiClients,
        isAssignment: true,
    })],
    [OCResourceEnum.UserGroupAssignments, new OCResource({ 
        sdkObject: UserGroups,
        isAssignment: true,
        parentRefFieldName: "BuyerID",
        isChild: true,
        listMethodName: 'ListUserAssignments'
    })],
    [OCResourceEnum.AddressAssignments, new OCResource({ 
        sdkObject: Addresses,
        isAssignment: true,
        parentRefFieldName: "BuyerID",
        isChild: true,
    })],
    [OCResourceEnum.CostCenterAssignments, new OCResource({ 
        sdkObject: CostCenters,
        isAssignment: true,
        parentRefFieldName: "BuyerID",
        isChild: true,
    })],
    [OCResourceEnum.CreditCardAssignments, new OCResource({ 
        sdkObject: CreditCards,
        isAssignment: true,
        parentRefFieldName: "BuyerID",
        isChild: true,
    })],
    [OCResourceEnum.SpendingAccountAssignments, new OCResource({ 
        sdkObject: SpendingAccounts,
        isAssignment: true,
        parentRefFieldName: "BuyerID",
        isChild: true,
    })],
    [OCResourceEnum.SupplierUserGroupsAssignments, new OCResource({ 
        sdkObject: SupplierUserGroups,
        isAssignment: true,
        parentRefFieldName: "SupplierID",
        isChild: true,
        listMethodName: 'ListUserAssignments'
    })],
    [OCResourceEnum.ProductAssignments, new OCResource({ 
        sdkObject: Products,
        isAssignment: true,
    })],
    [OCResourceEnum.CatalogAssignments, new OCResource({ 
        sdkObject: Catalogs,
        isAssignment: true,
    })],
    [OCResourceEnum.CatalogProductAssignment, new OCResource({ 
        sdkObject: Catalogs,
        isAssignment: true,
        listMethodName: 'ListProductAssignments'
    })],
    [OCResourceEnum.CategoryAssignments, new OCResource({ 
        sdkObject: Categories,
        isAssignment: true,
        parentRefFieldName: "CatalogID",
        isChild: true,
    })],
    [OCResourceEnum.CategoryProductAssignments, new OCResource({ 
        sdkObject: Categories,
        isAssignment: true,
        parentRefFieldName: "CatalogID",
        isChild: true,
        listMethodName: 'ListProductAssignments'
    })],
    [OCResourceEnum.SpecProductAssignments, new OCResource({ 
        sdkObject: Specs,
        isAssignment: true,
        listMethodName: 'ListProductAssignments'
    })],
    [OCResourceEnum.PromotionAssignment, new OCResource({ 
        sdkObject: Promotions,
        isAssignment: true,
    })],
]);
