import { RecordValidationFunc } from "../services/custom-validation-func";
import { OCResourceDirectoryEntry } from "./oc-resource-directory";
import { OCResourceEnum } from "./oc-resource-enum";
import { ReasourceSchema } from "./open-api";

export class OCResource {
    name: OCResourceEnum;
    children: OCResource[];
    parent: OCResource;
    openApiSpec: OpenAPISpec;
    isAssignment: boolean;
    isParent: boolean;
    isChild: boolean;
    hasSellerOwnerField: boolean;
    routeParams: string[];
    createPriority: number; // higher numbers need to be created first
    outgoingResourceReferences?: ResourceReference[];
    //incommingResourceReferences?: ResourceReference[];
    redactFields?: string[];
    downloadTransformFunc: (x: any) => any;
    customValidationFunc: RecordValidationFunc;
    shouldAttemptListFunc: (parentRecord: any) => boolean;

    constructor(entry: OCResourceDirectoryEntry, openAPISpec: any, parent: OCResource = null, children: OCResource[] = []) {
        this.name = entry.name;
        this.isAssignment = this.isAssignment;
        this.createPriority = entry.createPriority;
        this.outgoingResourceReferences = entry.outgoingResourceReferences ?? [];
        this.redactFields = entry.redactFields ?? [];
        this.routeParams = entry.routeParams ?? [];
        this.downloadTransformFunc = entry.downloadTransformFunc ?? (x => x)
        this.customValidationFunc = entry.customValidationFunc ?? ((_, __, ___) => {});
        this.shouldAttemptListFunc = entry.shouldAttemptListFunc ?? (_ => true);
        var path = openAPISpec.paths[entry.openApiSpec.resourcePath];
        var createOperation = path.post ?? path.put;
        this.openApiSpec = {
            listFunction: entry.openApiSpec.listFunction,
            createFunction: entry.openApiSpec.createFunction,
            createOperation: createOperation,
            resourceSchema: openAPISpec.components.schemas[entry.openApiSpec.schemaName],
            requiredCreateFields: createOperation?.requestBody?.content?.["application/json"]?.schema?.required ?? [],
        }
        this.children = children;
        this.parent = parent;
        this.hasSellerOwnerField = entry.outgoingResourceReferences.some(x => x.referenceType === ResourceReferenceType.Owner);
        this.isParent = children.length > 0;
        this.isChild = parent !== null;

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
    foreignParentRefField?: string;
    referenceType: ResourceReferenceType;
}

export enum ResourceReferenceType {
    Parent = "Parent",
    Child = "Child",
    Owner = "Owner", // reference to a Supplier ID or the Marketplace ID. Special b/c marketplace IDs need special handling
    Horizontal = "Horizontal",  // any reference that is not parent, child, or Seller
}




