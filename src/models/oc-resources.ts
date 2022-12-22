import { RecordValidationFunc } from "../services/custom-validation-func";
import { OCResourceEnum } from "./oc-resource-enum";
import { OpenAPIProperties } from "./open-api";
export interface OCResource {
    name: OCResourceEnum;
    openApiSchemaName: string; // matches open api spec model for POST
    children?: OCResourceEnum[];
    isAssignment: boolean,
    isChild: boolean;
    isParent: boolean;
    isSellerOwned: boolean;
    parentResource?: OCResource;
    secondRouteParam?: string
    sdkObject: any;
    createPriority: number; // higher numbers need to be created first
    openApiListOperation?: string;
    openApiCreateOperation?: string;
    outgoingResourceReferences?: ResourceReference[];
    //incommingResourceReferences?: ResourceReference[];
    openApiProperties?: OpenAPIProperties;
    openApiCreatePath: string;
    requiredCreateFields?: string[];
    redactFields?: string[];
    downloadTransformFunc?: (x: any) => any,
    customValidationFunc?: RecordValidationFunc,
    shouldAttemptListFunc?: (parentRecord: any) => boolean
}

export interface ForeignKeys {
    [fieldName: string]: ResourceReference;
}

export interface ResourceReference {
    fieldOnThisResource: string;
    fieldOnOtherReasource: string;
    otherResourceName: OCResourceEnum;
    foreignParentRefField?: string;
    referenceType: ResourceReferenceType;
}

export enum ResourceReferenceType {
    Parent = "Parent",
    Child = "Child",
    Owner = "Owner", // reference to a Supplier ID or the Marketplace ID. Special b/c marketplace IDs need special handling
    Horizontal = "Horizontal",  // any reference that is not parent, child, or Seller
}




