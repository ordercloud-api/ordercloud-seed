import { BuildResourceDirectory } from "../models/oc-resource-directory";
import { OCResourceEnum } from "../models/oc-resource-enum";
import { OCResource, OpenAPIProperties, OpenAPIProperty } from "../models/oc-resources";
import SeedFile from "../models/seed-file";
import { log, MessageType, ValidateResponse } from "../models/validate-response";
import { CustomForeignKeyValidation } from '../models/oc-resources';
import _, { trimEnd } from "lodash";
import { OpenAPIType } from "../models/open-api";

export async function validate(filePath: string): Promise<ValidateResponse> {
    var file = new SeedFile(); 
    var validator = new Validator();
    // validates file is found and is valid yaml
    var success = file.ReadFromYaml(filePath, validator.response); 
    if (!success) return validator.response;

    var directory = await BuildResourceDirectory(true);
    // validate duplicate IDs 
    for (let resource of directory) {
        validator.currentResource = resource;
        if (hasIDProperty(resource.openAPIProperties)) {         
            validator.idSets[resource.name] = new Set();
            for (let record of file.GetRecords(resource)) {
                validator.currentRecord = record;                
                validator.validateDuplicateIDs();
            }
        }
    }
    // now that idSets are built, can validate forigen keys
    for (let resource of directory) {
        validator.currentResource = resource;
        for (let record of file.GetRecords(resource)) {
            validator.currentRecord = record;
            for (const [propName, spec] of Object.entries(resource.openAPIProperties)) {
                validator.currentPropertyName = propName;
                if (spec.readOnly) {
                    continue;
                }
                let value = record[propName];
                let foreignKey = resource.foreignKeys[propName];
                if (isNullOrUndefined(value)) {
                    validator.validateIsRequired(propName);
                } else {
                    var typeMatches = validator.validateFieldTypeMatches(record[propName], spec);
                    if (typeMatches &&!isNullOrUndefined(foreignKey)) {
                        validator.validateForeignKeyExists(foreignKey)
                    }
                }
            }    
        }
    }
    return validator.response;
}

function hasIDProperty(properties: OpenAPIProperties) {
    return 'ID' in properties;
}

function isNullOrUndefined(value: any) {
    return value === null || value === undefined;
}

function getType(value: any): OpenAPIType {
    if (_.isArray(value)) return 'array';
    if (_.isPlainObject(value)) return 'object';
    if (_.isString(value)) return 'string';
    if (_.isBoolean(value)) return 'boolean'
    if (_.isInteger(value)) return 'integer';
    return 'number';
}

class Validator {
    response = new ValidateResponse();
    idSets: { [key in OCResourceEnum]?: Set<any> } = {};
    currentResource : OCResource;
    currentRecord: any;
    currentPropertyName: string;

    validateIsRequired(fieldName: string): boolean {
        if (this.currentResource.requiredCreateFields.includes(fieldName)) {
            this.response.addError(`Required field ${this.currentResource.name}.${fieldName}: cannot have value ${this.currentRecord[fieldName]}.`);
            return false;
        }
        return true;
    }

    validateForeignKeyExists(key: OCResourceEnum | CustomForeignKeyValidation):boolean {
        var field = this.currentPropertyName;
        var value = this.currentRecord[field];
        if (_.isFunction(key)) {

        } else {
            var resourceType = key as OCResourceEnum;
            var keyExists = this.idSets[resourceType].has(value);
            if (!keyExists) {
                this.response.addError(`Invalid reference ${this.currentResource.name}.${field}: no ${resourceType} found with ID \"${value}\".`);
                return false;
            }
        }
        return true;
    }
    
    
    // TODO - validate things inside objects or arrays
    validateFieldTypeMatches(value: any, spec: OpenAPIProperty): boolean {
        // todo - need to do this differently. Get a swagger parser library
        if ((spec as any).allOf) {
            spec.type = "object";
        }
        var error: string = null;
        var typeError = `Incorrect type ${this.currentResource.name}.${this.currentPropertyName}: ${value} is ${getType(value)}. Should be ${spec.type}.`;
        
        switch (spec.type) {
            case 'object':
                if (!_.isPlainObject(value)) error = typeError;
                break;  
            case 'array':
                if (!_.isArray(value)) error = typeError;
                break;
            case 'integer':
                if (!_.isInteger(value)) {
                    error = typeError;
                } else {
                    if ((spec.maximum || Infinity) < value) {
                        error = `Maximum for ${this.currentResource.name}.${this.currentPropertyName} is ${spec.maximum}. Found ${value}.`;
                    }
                    if ((spec.minimum || -Infinity) > value) {
                       error =  `Minimum for ${this.currentResource.name}.${this.currentPropertyName} is ${spec.minimum}. Found ${value}.`;
                    }
                }
                break;
            case 'number':
                if (!_.isNumber(value)) error = typeError;
                break;    
            case 'boolean':
                if (!_.isBoolean(value)) error = typeError;
                break;  
            case 'string':
                if (!_.isString(value)) { 
                    error = typeError;
                } else {
                    if ((spec.maxLength || Infinity) < value.length) {
                        error = `Max string length for ${this.currentResource.name}.${this.currentPropertyName} is ${spec.maxLength}. Found \"${value}\".`;
                    }
                    if (spec.format === 'date-time' && !Date.parse(value)) {
                        error = `${this.currentResource.name}.${this.currentPropertyName} should be a date format. Found \"${value}\".`;
                    }
                }        
                break;      
        }
        if (error !== null) {
            this.response.addError(error);
            return false;
        }
        return true;
    }
    
    // todo - need to validate duplicates that involve more fields that simply ID. e.g. xpindex 
    validateDuplicateIDs(): boolean {
        if (isNullOrUndefined(this.currentRecord.ID) || !hasIDProperty(this.currentResource.openAPIProperties)) {
            return true;
        }
        var setEntry: string = this.currentResource.isChild ? `${this.currentRecord[this.currentResource.parentRefFieldName]}/${this.currentRecord.ID}` : this.currentRecord.ID;
        if (this.idSets[this.currentResource.name].has(setEntry)) {
            var message = `Duplicate ID: multiple ${this.currentResource.name} with ID \"${this.currentRecord.ID}\"`;
            if (setEntry.includes('/')) {
                message = message.concat(` within the ${this.currentResource.parentRefFieldName} \"${this.currentRecord[this.currentResource.parentRefFieldName]}\"`)
            }
            this.response.addError(message)
            return false;
        } else {
            this.idSets[this.currentResource.name].add(setEntry)
        }
        return true;
    }
}