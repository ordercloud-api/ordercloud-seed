import { OCResourceEnum } from "./oc-resource-enum.js";

export function ApplyDefaults(resource: OCResource): OCResource {
    resource.isAssignment = resource.isAssignment || false;
    resource.listMethodName = resource.listMethodName || (resource.isAssignment ? "ListAssignments" : "List");
    resource.createMethodName = resource.createMethodName || (resource.isAssignment ? "CreateAssignment" : "Create");
    //config.createForeignKeys = config.createForeignKeys || [];
    resource.children = resource.children || [];
    resource.isChild = resource.isChild || false;

    return resource;
}

export interface OCResource {
    name: OCResourceEnum;
    children?: OCResourceEnum[];
    isChild?: boolean;
    parentRefFieldName?: string; // will be populated if and only if isChild is true
    sdkObject: any;
    isAssignment?: boolean,
    createPriority?: number; // make required. higher numbers need to be created first
    listMethodName?: string;
    createMethodName?: string;
    //createForeignKeys?: ForeignKey[];
}

export interface ForeignKey {
    resource: OCResourceEnum,
    fieldName: string
}

