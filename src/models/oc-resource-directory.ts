import axios from "axios";
import { Addresses, AdminAddresses, InventoryRecords, AdminUserGroups, AdminUsers, ApiClients, ApprovalRules, Buyers, Catalogs, Categories, CostCenters, CreditCards, ImpersonationConfigs, Incrementors, IntegrationEvents, Locales, MessageSenders, OpenIdConnects, PriceSchedules, ProductFacets, Products, Promotions, SecurityProfiles, Specs, SpendingAccounts, SupplierAddresses, Suppliers, SupplierUserGroups, SupplierUsers, UserGroups, Users, Webhooks, XpIndices, SellerApprovalRules } from "ordercloud-javascript-sdk";
import { OCResourceEnum } from "./oc-resource-enum";
import { OCResourceMetaData as OCResourceMetadata, RedactionDetails, ResourceReference, ResourceReferenceType, UploadTransformFunc } from "./oc-resource-metadata";
import _ from 'lodash';
import { SeedRunContext } from "./seed-run-context";
import { OpenAPIProperties } from "./open-api";
import { Random } from "../services/util";

type OCResourcesMetaData = {
    [key in OCResourceEnum]: OCResourceMetadata
}

type OCResourcesMetaDataHardCoded = {
    [key in OCResourceEnum]: OCResourceMetaDataHardCoded
}

// Hard coded in the directory to match records with the Open API Spec
interface OpenAPISpecHardCoded {
    schemaName: string; // matches open api spec model for POST
    listFunction: Function;
    createFunction: Function;
    resourceCreatePath: string;
    schemaAllProperties?: OpenAPIProperties; // used to validate field types
    createOperationRequiredProperties?: string[]; // used to validate required fields
}

export interface OCResourceMetaDataHardCoded {
    openApiSpec: OpenAPISpecHardCoded;
    isAssignment: boolean;
    routeParams?: string[];
    createPriority: number; // higher numbers need to be created first
    outgoingResourceReferences?: ResourceReference[];
    redact?: RedactionDetails[];
    uploadTransformFunc?: UploadTransformFunc
    downloadTransformFunc?: (x: any) => any;
    shouldAttemptListFunc?: (parentRecord: any) => boolean;
}

function GetWebhookSecret(context: SeedRunContext): string {
    return context.webhookSecret;
}

const ocResourceMetaDataHardCoded: OCResourcesMetaDataHardCoded = {
    [OCResourceEnum.SecurityProfile]: { 
        openApiSpec: {
            schemaName: 'SecurityProfile',
            resourceCreatePath: "/securityprofiles",
            listFunction: SecurityProfiles.List,
            createFunction: SecurityProfiles.Create
        }, 
        createPriority: 2,
        isAssignment: false,
    },
    [OCResourceEnum.ImpersonationConfig]: { 
        openApiSpec: {
            schemaName: 'ImpersonationConfig',
            resourceCreatePath: "/impersonationconfig",
            listFunction: ImpersonationConfigs.List,
            createFunction: ImpersonationConfigs.Create
        }, 
        createPriority: 7,
        isAssignment: false,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "ClientID",
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.ApiClient,  
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "SecurityProfileID", 
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.SecurityProfile,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "BuyerID", 
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.Buyer, 
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "GroupID",
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.UserGroup,
            },
            { 
                referenceType: ResourceReferenceType.Reference,  
                fieldNameOnThisResource: "UserID",
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.User,
            },
            { 
                referenceType: ResourceReferenceType.Reference, 
                fieldNameOnThisResource: "ImpersonationBuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyer,
            },
        ]
    },
    [OCResourceEnum.OpenIdConnect]: {
        openApiSpec: {
            schemaName: 'OpenIdConnect',
            resourceCreatePath: "/openidconnects",
            listFunction: OpenIdConnects.List,
            createFunction: OpenIdConnects.Create
        }, 
        createPriority: 7,
        isAssignment: false,
        redact: [
            { 
                field: "ConnectClientSecret", 
                onSeedReplaceBy: (_ => "")
            }
        ],
        outgoingResourceReferences: 
        [
            { 
                referenceType: ResourceReferenceType.Reference,  
                fieldNameOnThisResource: "OrderCloudApiClientID",
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.ApiClient,
            },
            { 
                referenceType: ResourceReferenceType.Reference, 
                fieldNameOnThisResource: "IntegrationEventID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.IntegrationEvent,
            }
        ]
    },
    [OCResourceEnum.AdminUser]: {
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
    [OCResourceEnum.AdminUserGroup]: {
        openApiSpec: {
            schemaName: 'UserGroup',
            resourceCreatePath: "/usergroups",
            listFunction: AdminUserGroups.List,
            createFunction: AdminUserGroups.Create
        },  
        createPriority: 2,
        isAssignment: false,
    },
    [OCResourceEnum.AdminAddress]: {
        openApiSpec: {
            schemaName: 'Address',
            resourceCreatePath: "/addresses",
            listFunction: AdminAddresses.List,
            createFunction: AdminAddresses.Create
        }, 
        createPriority: 2,
        isAssignment: false,
    },
    [OCResourceEnum.MessageSender]: {
        openApiSpec: {
            schemaName: 'MessageSender',
            resourceCreatePath: "/messagesenders",
            listFunction: MessageSenders.List,
            createFunction: MessageSenders.Create
        }, 
        createPriority: 2,
        isAssignment: false,
        redact: [
            { 
                field: "SharedKey", 
                onSeedReplaceBy: GetWebhookSecret
            }
        ],
    },
    [OCResourceEnum.ApiClient]: {
        openApiSpec: {
            schemaName: 'ApiClient',
            resourceCreatePath: "/apiclients",
            listFunction: ApiClients.List,
            createFunction: ApiClients.Create
        }, 
        createPriority: 6,
        isAssignment: false,
        redact: [
            { 
                field: "ShareClientSecretdKey", 
                onSeedReplaceBy: ((_) => Random.generateClientSecret())
            }
        ],
        outgoingResourceReferences:
        [
            { 
                referenceType: ResourceReferenceType.Reference,  
                fieldNameOnThisResource: "OrderCheckoutIntegrationEventID",
                fieldNameOnOtherReasource: "ID",
                otherResourceName: OCResourceEnum.IntegrationEvent,
            },
            { 
                referenceType: ResourceReferenceType.Reference, 
                fieldNameOnThisResource: "OrderReturnIntegrationEventID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.IntegrationEvent,
            },
            { 
                referenceType: ResourceReferenceType.Reference, 
                fieldNameOnThisResource: "AddToCartIntegrationEventID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.IntegrationEvent,
            },
        ],
        downloadTransformFunc: (x) => {
            x.ID = x.ID.toLowerCase(); // funky platform thing with API CLient ID casing
            return x;
        },
    },
    [OCResourceEnum.Locale]: {
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
                referenceType: ResourceReferenceType.SellerOwner,
                fieldNameOnThisResource: "OwnerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Supplier,
            },
        ],
    },
    [OCResourceEnum.Incrementor]: {
        openApiSpec: {
            schemaName: 'Incrementor',
            resourceCreatePath: "/incrementors",
            listFunction: Incrementors.List,
            createFunction: Incrementors.Create
        }, 
        createPriority: 1,
        isAssignment: false,
    },
    [OCResourceEnum.Webhook]: {
        openApiSpec: {
            schemaName: "Webhook",
            resourceCreatePath: "/webhooks",
            listFunction: Webhooks.List,
            createFunction: Webhooks.Create
        }, 
        createPriority: 7,
        isAssignment: false,
        redact: [
            { 
                field: "HashKey", 
                onSeedReplaceBy: GetWebhookSecret
            }
        ],
        // for .ApiClientIDs
    },
    [OCResourceEnum.IntegrationEvent]: {
        openApiSpec: {
            schemaName: "IntegrationEvent",
            resourceCreatePath: "/integrationEvents",
            listFunction: IntegrationEvents.List,
            createFunction: IntegrationEvents.Create
        },  
        createPriority: 2,
        isAssignment: false,
        redact: [
            { 
                field: "HashKey", 
                onSeedReplaceBy: GetWebhookSecret
            }
        ],
    },
    [OCResourceEnum.XpIndex]: {
        openApiSpec: {
            schemaName: "XpIndex",
            resourceCreatePath: "/xpindices",
            listFunction: XpIndices.List,
            createFunction: XpIndices.Put
        }, 
        createPriority: 1,
        isAssignment: false,
    },
    [OCResourceEnum.Buyer]: {
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
                otherResourceName: OCResourceEnum.Catalog,
            }
        ]
    },
    [OCResourceEnum.User]: {
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
                otherResourceName: OCResourceEnum.Buyer,
            },
        ],
        downloadTransformFunc: (x) => { 
            delete x.Locale;
            return x;
        }
    },
    [OCResourceEnum.UserGroup]: {
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
                otherResourceName: OCResourceEnum.Buyer,
            },
        ],
    },
    [OCResourceEnum.Address]: {
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
                otherResourceName: OCResourceEnum.Buyer,
            },
        ],
    },
    [OCResourceEnum.CostCenter]: {
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
                otherResourceName: OCResourceEnum.Buyer,
            },
        ],
    },
    [OCResourceEnum.CreditCard]: {
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
                otherResourceName: OCResourceEnum.Buyer,
            },
        ],
    },
    [OCResourceEnum.SpendingAccount]: {
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
                otherResourceName: OCResourceEnum.Buyer,
            },
        ]
    },
    [OCResourceEnum.ApprovalRule]: {
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
                otherResourceName: OCResourceEnum.Buyer,
            },
            { 
                fieldNameOnThisResource: "ApprovingGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroup,
                referenceType: ResourceReferenceType.Reference,
            }
        ]
    },
    [OCResourceEnum.Catalog]: {
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
                referenceType: ResourceReferenceType.SellerOwner,
                fieldNameOnThisResource: "OwnerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Supplier,
            },
        ]
    },
    [OCResourceEnum.Category]: {
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
                otherResourceName: OCResourceEnum.Catalog,
            },
            { 
                fieldNameOnThisResource: "CatalogID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Category,
                referenceType: ResourceReferenceType.Reference,
            }
        ],
    },
    [OCResourceEnum.Supplier]: {
        openApiSpec: {
            schemaName: "Supplier",
            resourceCreatePath: "/suppliers",
            listFunction: Suppliers.List,
            createFunction: Suppliers.Create
        },
        createPriority: 2,
        isAssignment: false,
    },
    [OCResourceEnum.SupplierUser]: {
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
                otherResourceName: OCResourceEnum.Supplier,
            },
        ],
        downloadTransformFunc: (x) => { 
            delete x.Locale;
            return x;
        }
    },
    [OCResourceEnum.SupplierUserGroup]: {
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
                otherResourceName: OCResourceEnum.Supplier,
            },
        ],
    },
    [OCResourceEnum.SupplierAddress]: {
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
                otherResourceName: OCResourceEnum.Supplier,
            },
        ]
    },
    [OCResourceEnum.Product]: {
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
                referenceType: ResourceReferenceType.SellerOwner,
                fieldNameOnThisResource: "OwnerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Supplier,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "DefaultPriceScheduleID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.PriceSchedule,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "DefaultSupplierID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Supplier,
            },
        ],
    },
    [OCResourceEnum.PriceSchedule]: {
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
                referenceType: ResourceReferenceType.SellerOwner,
                fieldNameOnThisResource: "OwnerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Supplier,
            },
        ]
    },
    [OCResourceEnum.Spec]: {
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
                referenceType: ResourceReferenceType.SellerOwner,
                fieldNameOnThisResource: "OwnerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Supplier,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "DefaultOptionID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SpecOption,
            },
        ],
        uploadTransformFunc: (record, context) => {
            if (!_.isNil(record.DefaultOptionID)) { 
                context.addSpecDefaultOption(record); // need these later to patch specs after options are created
                record.DefaultOptionID = null; // set null so create spec succeeds 
            }
        },
    },
    [OCResourceEnum.SpecOption]: {
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
                otherResourceName: OCResourceEnum.Spec,
            },
        ],
    },
    [OCResourceEnum.ProductFacet]: {
        openApiSpec: {
            schemaName: "ProductFacet",
            resourceCreatePath: "/productfacets",
            listFunction: ProductFacets.List,
            createFunction: ProductFacets.Create
        }, 
        createPriority: 2,
        isAssignment: false,
    },
    [OCResourceEnum.Promotion]: {
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
                referenceType: ResourceReferenceType.SellerOwner,
                fieldNameOnThisResource: "OwnerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Supplier,
            },
        ],
    },
    [OCResourceEnum.Variant]: {
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
                otherResourceName: OCResourceEnum.Product,
            },
        ],
        shouldAttemptListFunc: (product) => (product?.VariantCount > 0),
    },
    [OCResourceEnum.InventoryRecord]: {
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
                otherResourceName: OCResourceEnum.Product,
            },
            { 
                referenceType: ResourceReferenceType.SellerOwner,
                fieldNameOnThisResource: "OwnerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Supplier,
            },
        ],
    },
    [OCResourceEnum.VariantInventoryRecord]: {
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
                otherResourceName: OCResourceEnum.Product,
            },
            { 
                referenceType: ResourceReferenceType.SellerOwner,
                fieldNameOnThisResource: "OwnerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Supplier,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "VariantID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Variant,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "ProductID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Product,
            },
        ],
    },
    [OCResourceEnum.SellerApprovalRule]: {
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
                referenceType: ResourceReferenceType.SellerOwner,
                fieldNameOnThisResource: "OwnerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Supplier,
            },
        ],
    },
    [OCResourceEnum.SecurityProfileAssignment]: {
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
                otherResourceName: OCResourceEnum.SecurityProfile,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyer,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "SupplierID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Supplier,
            },
        ], 
    },
    [OCResourceEnum.AdminUserGroupAssignment]: {
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
                otherResourceName: OCResourceEnum.AdminUser,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.AdminUserGroup,
            },
        ]
    },
    [OCResourceEnum.ApiClientAssignment]: {
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
                otherResourceName: OCResourceEnum.ApiClient,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyer,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "SupplierID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Supplier,
            },
        ],
        downloadTransformFunc: (x) => {
            x.ApiClientID = x.ApiClientID.toLowerCase(); // funky platform thing with API CLient ID casing
            return x;
        },
    },
    [OCResourceEnum.LocaleAssignment]: {
        openApiSpec: {
            schemaName: "LocaleAssignment",
            resourceCreatePath: "/locales/assignments",
            listFunction: Locales.SaveAssignment,
            createFunction: Locales.ListAssignments
        },
        createPriority: 6,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "LocaleID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Locale,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyer,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroup,
            },
        ],
    },
    [OCResourceEnum.UserGroupAssignment]: {
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
                otherResourceName: OCResourceEnum.Buyer,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.User,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroup,
            },
        ],           
    },
    [OCResourceEnum.AddressAssignment]: {
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
                otherResourceName: OCResourceEnum.Buyer,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "AddressID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Address,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.User,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroup,
            },
        ],
    },
    [OCResourceEnum.CostCenterAssignment]: {
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
                otherResourceName: OCResourceEnum.Buyer,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "CostCenterID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.CostCenter,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroup,
            },
        ],       
    },
    [OCResourceEnum.CreditCardAssignment]: {
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
                otherResourceName: OCResourceEnum.Buyer,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "CreditCardID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.CreditCard,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.User,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroup,
            },
        ],
    },
    [OCResourceEnum.SpendingAccountAssignment]: {
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
                otherResourceName: OCResourceEnum.Buyer,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "SpendingAccountID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SpendingAccount,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.User,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroup,
            },
        ],   
    },
    [OCResourceEnum.SupplierUserGroupsAssignment]: {
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
                otherResourceName: OCResourceEnum.Supplier,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SupplierUser,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SupplierUserGroup,
            },
        ],           
    },
    [OCResourceEnum.ProductAssignment]: {
        openApiSpec: {
            schemaName: "ProductAssignment",
            resourceCreatePath: "/products/assignments",
            listFunction: Products.ListAssignments,
            createFunction: Products.SaveAssignment
        },
        createPriority: 6,
        isAssignment: true,
        outgoingResourceReferences: [
            { 
                referenceType: ResourceReferenceType.SellerOwner,
                fieldNameOnThisResource: "SellerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Supplier,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "ProductID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Product,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyer,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "PriceScheduleID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.PriceSchedule,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroup,
            },
        ],         
    },
    [OCResourceEnum.CatalogAssignment]: {
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
                otherResourceName: OCResourceEnum.Catalog,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyer,
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
                otherResourceName: OCResourceEnum.Catalog,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "ProductID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Product,
            },
        ]                   
    },
    [OCResourceEnum.CategoryAssignment]: {
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
                otherResourceName: OCResourceEnum.Catalog,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "CategoryID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Category,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyer,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroup,
            },
        ]           
    },
    [OCResourceEnum.CategoryProductAssignment]: {
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
                otherResourceName: OCResourceEnum.Catalog,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "CategoryID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Category,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "ProductID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Product,
            },
        ]           
    },
    [OCResourceEnum.SpecProductAssignment]: {
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
                otherResourceName: OCResourceEnum.Spec,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "ProductID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Product,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "DefaultOptionID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.SpecOption,
            },
        ]
    },
    [OCResourceEnum.PromotionAssignment]: {
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
                otherResourceName: OCResourceEnum.Promotion,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyer,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "UserGroupID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.UserGroup,
            },
        ]
    },
    [OCResourceEnum.ProductSupplierAssignment]: {
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
                otherResourceName: OCResourceEnum.Product,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "SupplierID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Supplier,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "DefaultPriceScheduleID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.PriceSchedule,
            },
        ],
        downloadTransformFunc: (x) => { 
            return { SupplierID: x.ID, DefaultPriceScheduleID: x.DefaultPriceScheduleID };
        }
    },
    [OCResourceEnum.SupplierBuyerAssignment]: {
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
                otherResourceName: OCResourceEnum.Supplier,
            },
            { 
                referenceType: ResourceReferenceType.Reference,
                fieldNameOnThisResource: "BuyerID",
                fieldNameOnOtherReasource: "ID", 
                otherResourceName: OCResourceEnum.Buyer,
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
    Object.entries(ocResourceMetaDataHardCoded).forEach(([name, metaData]) => {  

        return new OCResourceMetadata(name, metaData, openAPISpec);
    });
    return new OCResourceDirectory(dir);
}



