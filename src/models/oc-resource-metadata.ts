import { ValidationContext } from "../services/validation-context";
import { OCResourceEnum } from "./oc-resource-enum";
import { OpenAPIProperties, ReasourceSchema } from "./open-api";

export class OCResourceMetaData {
    name: OCResourceEnum;
    children: OCResourceMetaData[];
    parent: OCResourceMetaData;
    openApiSpec: OpenAPISpec;
    isAssignment: boolean;
    isParent: boolean;
    isChild: boolean;
    hasSellerOwnerField: boolean;
    routeParamNames: string[];
    sellerOwnerReference?: ResourceReference;
    parentReference?: ResourceReference;
    createPriority: number; // higher numbers need to be created first
    // Fields on this resource that point to the ID of a different resource
    outgoingResourceReferences?: ResourceReference[];
    // Fields on other resources that point to the ID of this resource
    incommingResourceReferences?: ResourceReference[];
    redactFields: string[];
    downloadTransformFunc: (x: any) => any;
    customRecordValidationFunc: ValidationFunc;
    shouldAttemptListFunc: (parentRecord: any) => boolean;

    constructor(name: OCResourceEnum, meta: OCResourceMetaDataHardCoded, openAPISpec: any, children: OCResourceMetaData[] = []) {
        this.name = name;
        this.isAssignment = meta.isAssignment;
        this.createPriority = meta.createPriority;
        this.outgoingResourceReferences = meta.outgoingResourceReferences ?? [];
        this.redactFields = meta.redactFields ?? [];
        this.routeParamNames = meta.routeParams ?? [];
        this.downloadTransformFunc = meta.downloadTransformFunc ?? (x => x)
        this.customRecordValidationFunc = meta.customValidationFunc ?? (_ => {});
        this.shouldAttemptListFunc = meta.shouldAttemptListFunc ?? (_ => true);
        var path = openAPISpec.paths[meta.openApiSpec.resourceCreatePath];
        var createOperation = path.post ?? path.put;
        this.openApiSpec = {
            listFunction: meta.openApiSpec.listFunction,
            createFunction: meta.openApiSpec.createFunction,
            createOperation: createOperation,
            resourceSchema: openAPISpec.components.schemas[meta.openApiSpec.schemaName],
            requiredCreateFields: createOperation?.requestBody?.content?.["application/json"]?.schema?.required ?? [],
        }
        let owner = meta.outgoingResourceReferences.find(x => x.referenceType === ResourceReferenceType.Owner);
        this.hasSellerOwnerField = !!owner;
        this.sellerOwnerReference = owner ?? null;
        let parent = meta.outgoingResourceReferences.find(x => x.referenceType === ResourceReferenceType.Parent);
        this.isChild = !!parent;
        this.parentReference = parent ?? null;
        if (this.isChild) {
            this.openApiSpec.requiredCreateFields.push(this.parentReference.fieldNameOnThisResource);
            this.openApiSpec.resourceSchema.properties[this.parentReference.fieldNameOnThisResource] = { type: "string", readOnly: false };
        }

        this.children = children;
        this.parent = parent;
        this.isParent = children.length > 0;
    }

    getIdentifyingData(record: any): string[][] {
        let acc = [];
        this.routeParamNames.forEach(paramName => {
            acc.push([ [paramName], record[paramName]]);
        });
        if (this.hasIDField()) {
            acc.push(["ID", record["ID"]]);
        }
        return acc;
    }

    hasIDField(): boolean {
        return 'ID' in this.openApiSpec.resourceSchema.properties || this.name === OCResourceEnum.ApiClients;
    }

    hasUsernameField(): boolean {
        return "Username" in this.openApiSpec.resourceSchema.properties;
    }
}

export interface OpenAPISpec {
    createOperation: any;
    requiredCreateFields: string[];
    resourceSchema: ReasourceSchema;
    listFunction: Function;
    createFunction: Function;
}

export interface ResourceReference {
    fieldNameOnThisResource: string;
    fieldNameOnOtherReasource: string;
    otherResourceName: OCResourceEnum;
    referenceType: ResourceReferenceType;
    // Always true for type Child, always false for type Parent and Owner. Usually false for type Reference
    mulitpleReferencesAllowed?: boolean; 
    otherResource?: OCResourceMetaData;
}

export enum ResourceReferenceType {
    Parent = "Parent",
    Child = "Child",
    Owner = "Owner", // reference to a Supplier ID or the Marketplace ID. Special b/c marketplace IDs need special handling
    Reference = "Reference",  // any reference that is not parent, child, or Seller
}

export type ValidationFunc = (context: ValidationContext) => void


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
    //incommingResourceReferences?: ResourceReference[];
    redactFields?: string[];
    downloadTransformFunc?: (x: any) => any,
    customValidationFunc?: ValidationFunc,
    shouldAttemptListFunc?: (parentRecord: any) => boolean
}





