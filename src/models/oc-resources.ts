import { OCResourceEnum } from "./oc-resource-enum.js";
import SeedFile from "./seed-file.js";
export interface OCResource {
    name: OCResourceEnum;
    modelName: string; // matches open api spec model for POST
    children?: OCResourceEnum[];
    isChild?: boolean;
    parentRefFieldName?: string; // will be populated if and only if isChild is true
    sdkObject: any;
    isAssignment?: boolean,
    createPriority: number; // higher numbers need to be created first
    listMethodName?: string;
    createMethodName?: string;
    foreignKeys?: ForeignKeys;
    openAPIProperties?: OpenAPIProperties
}

export interface OpenAPIProperty {
    type: 'string' | 'integer' | 'number' | 'boolean' | 'object' | 'array';
    format : 'int32' | 'float' | 'password' | 'date-time';
    readOnly : boolean;
    maxLength : number;
    default: any;
    minimum: number;
    maximum: number;
}

export interface ForeignKeys {
    [fieldName: string]: OCResourceEnum | CustomForeignKeyValidation;
}

export interface OpenAPIProperties {
    [propertyName: string]: OpenAPIProperty;
}

// TODO - replace boolean with a useful error message.
type CustomForeignKeyValidation = (fieldValue: string, file: SeedFile) => boolean

