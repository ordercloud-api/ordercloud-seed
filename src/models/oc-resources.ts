import { OCResourceEnum } from "./oc-resource-enum.js";
import SeedFile from "./seed-file.js";

export function ApplyDefaults(resource: OCResource): OCResource {
    resource.isAssignment = resource.isAssignment || false;
    resource.listMethodName = resource.listMethodName || (resource.isAssignment ? "ListAssignments" : "List");
    resource.createMethodName = resource.createMethodName || (resource.isAssignment ? "CreateAssignment" : "Create");
    resource.foreignKeys = resource.foreignKeys || {};
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
    createPriority: number; // higher numbers need to be created first
    listMethodName?: string;
    createMethodName?: string;
    foreignKeys?: ForeignKeys;
}

export interface ForeignKeys {
    [fieldName: string]: OCResourceEnum | CustomForeignKeyValidation;
}

// TODO - replace boolean with a useful error message.
type CustomForeignKeyValidation = (fieldValue: string, file: SeedFile) => boolean

