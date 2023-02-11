import { SeedRunContext } from "./seed-run-context";
import { ValidationRunContext } from "./validation-run-context";
import { OCResourceEnum } from "./oc-resource-enum";
import { ReasourceSchema } from "./open-api";
import { OCResourceMetaDataHardCoded } from "./oc-resource-directory";

export class OCResourceMetaData {
    name: OCResourceEnum;
    openApiSpec: OpenAPISpec;
    isAssignment: boolean;
    isParent: boolean;
    isChild: boolean;
    hasSellerOwnerField: boolean;
    routeParamNames: string[];
    sellerOwnerReference?: ResourceReference;
    parentReference?: ResourceReference;
    childrenReferences?: ResourceReference[];
    createPriority: number; // higher numbers need to be created first
    // Fields on this resource that point to the ID of a different resource
    outgoingResourceReferences?: ResourceReference[];
    // Fields on other resources that point to the ID of this resource
    // incommingResourceReferences?: ResourceReference[];
    apiClientRefFields: string[]
    redactedFields: RedactionDetails[];
    uploadTransformFunc: UploadTransformFunc;
    downloadTransformFunc: (x: any) => any;
    shouldAttemptListFunc: (parentRecord: any) => boolean;

    constructor(name: OCResourceEnum, meta: OCResourceMetaDataHardCoded, openAPISpec: any) {
        this.name = name;
        this.isAssignment = meta.isAssignment;
        this.createPriority = meta.createPriority;
        this.outgoingResourceReferences = meta.outgoingResourceReferences ?? [];
        this.redactedFields = meta.redact ?? [];
        this.apiClientRefFields = meta.outgoingResourceReferences
                                    .filter(x => x.otherResourceName === OCResourceEnum.ApiClient)
                                    .map(x => x.fieldNameOnThisResource);
        this.routeParamNames = meta.routeParams ?? [];
        this.downloadTransformFunc = meta.downloadTransformFunc ?? (x => x)
        this.shouldAttemptListFunc = meta.shouldAttemptListFunc ?? (_ => true);
        this.uploadTransformFunc = meta.uploadTransformFunc ?? ((x, __) => x)
        var path = openAPISpec.paths[meta.openApiSpec.resourceCreatePath];
        var createOperation = path.post ?? path.put;
        this.openApiSpec = {
            listFunction: meta.openApiSpec.listFunction,
            createFunction: meta.openApiSpec.createFunction,
            createOperation: createOperation,
            resourceSchema: openAPISpec.components.schemas[meta.openApiSpec.schemaName],
            requiredCreateFields: createOperation?.requestBody?.content?.["application/json"]?.schema?.required ?? [],
        }
        let owner = meta.outgoingResourceReferences.find(x => x.referenceType === ResourceReferenceType.SellerOwner);
        this.hasSellerOwnerField = !!owner;
        this.sellerOwnerReference = owner ?? null;
        let parent = meta.outgoingResourceReferences.find(x => x.referenceType === ResourceReferenceType.Parent);
        this.isChild = !!parent;
        this.parentReference = parent ?? null;
        if (this.isChild) {
            this.openApiSpec.requiredCreateFields.push(this.parentReference.fieldNameOnThisResource);
            this.openApiSpec.resourceSchema.properties[this.parentReference.fieldNameOnThisResource] = { type: "string", readOnly: false };
        }
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
        return 'ID' in this.openApiSpec.resourceSchema.properties || this.name === OCResourceEnum.ApiClient;
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
    otherResource?: OCResourceMetaData;
}

export enum ResourceReferenceType {
    Parent = "Parent",
    Child = "Child",
    SellerOwner = "SellerOwner", // reference to a Supplier ID or the Marketplace ID. Special b/c marketplace IDs need special handling
    Reference = "Reference",  // any reference that is not parent, child, or Seller
}

export type UploadTransformFunc = (record: any, context: SeedRunContext) => any;

export type RedactionReplaceFunc = (context: SeedRunContext) => string;

export interface RedactionDetails {
    field: string;
    onSeedReplaceBy: RedactionReplaceFunc
}





