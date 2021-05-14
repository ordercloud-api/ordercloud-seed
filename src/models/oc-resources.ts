import { RecordValidationFunc } from "../services/custom-validation-func";
import { OCResourceEnum } from "./oc-resource-enum";
import { OpenAPIProperties } from "./open-api";
export interface OCResource {
    name: OCResourceEnum;
    modelName: string; // matches open api spec model for POST
    children?: OCResourceEnum[];
    isChild?: boolean;
    parentResource?: OCResource;
    parentRefFieldName?: string; // will be populated if and only if isChild is true
    sdkObject: any;
    isAssignment?: boolean,
    createPriority: number; // higher numbers need to be created first
    listMethodName?: string;
    createMethodName?: string;
    foreignKeys?: ForeignKeys;
    openAPIProperties?: OpenAPIProperties;
    path: string;
    requiredCreateFields?: string[];
    customValidationFunc?: RecordValidationFunc
}
export interface ForeignKeys {
    [fieldName: string]: OCResourceEnum;
}



