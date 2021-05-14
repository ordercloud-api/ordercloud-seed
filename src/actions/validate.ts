import { BuildResourceDirectory } from "../models/oc-resource-directory";
import { OCResourceEnum } from "../models/oc-resource-enum";
import { OCResource } from "../models/oc-resources";
import SeedFile from "../models/seed-file";
import { OpenAPIProperties, OpenAPIProperty, OpenAPIType } from "../models/open-api";
import _ from 'lodash';
import { IDCache } from "../services/id-cache";

export async function validate(filePath: string): Promise<string[]> {
    var file = new SeedFile(); 
    var validator = new Validator();
    // validates file is found and is valid yaml
    var success = file.ReadFromYaml(filePath, validator.errors); 
    if (!success) return validator.errors;

    var directory = await BuildResourceDirectory(true);
    // validate duplicate IDs 
    for (let resource of directory) {
        validator.currentResource = resource;
        var hasUsername = "Username" in resource.openAPIProperties;
        var hasID = hasIDProperty(resource.openAPIProperties);
        if (hasID || hasUsername) {         
            for (let record of file.GetRecords(resource)) {
                validator.currentRecord = record;   
                // this step builds validator.idCache, which will be needed for forign key validation later.             
                if (hasID) validator.validateDuplicateIDs(); 
                if (hasUsername) validator.validateDuplicateUsernames();
            }
        }
    }

    // now that idSets are built, another loop for the rest of validation
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
                if (_.isNil(value)) {
                    validator.validateIsRequired(propName);
                } else {
                    var typeMatches = validator.validateFieldTypeMatches(record[propName], spec);
                    if (typeMatches &&!_.isNil(foreignKey)) {
                        validator.validateForeignKeyExists(foreignKey)
                    }
                }
            }
            if (resource.customValidationFunc !== undefined) {
                resource.customValidationFunc(record, validator); 
            }
        }
    }
    return validator.errors;
}

function hasIDProperty(properties: OpenAPIProperties) {
    return 'ID' in properties;
}

function getType(value: any): OpenAPIType {
    if (_.isArray(value)) return 'array';
    if (_.isPlainObject(value)) return 'object';
    if (_.isString(value)) return 'string';
    if (_.isBoolean(value)) return 'boolean'
    if (_.isInteger(value)) return 'integer';
    return 'number';
}

export class Validator {
    errors: string[] = [];
    idCache = new IDCache();
    usernameCache = new Set<string>();
    currentResource: OCResource;
    currentRecord: any;
    currentPropertyName: string;

    addError(message:string) {
        this.errors.push(message);
    }

    validateIsRequired(fieldName: string): boolean {
        if (this.currentResource.requiredCreateFields.includes(fieldName)) {
            this.addError(`Required field ${this.currentResource.name}.${fieldName}: cannot have value ${this.currentRecord[fieldName]}.`);
            return false;
        }
        return true;
    }

    validateForeignKeyExists(resourceType: OCResourceEnum):boolean {
        var field = this.currentPropertyName;
        var value = this.currentRecord[field];
        // A standard validation to find an ID of a particular reasource
        var keyExists = this.idCache.has(resourceType, value);
        if (!keyExists) {
            this.addError(`Invalid reference ${this.currentResource.name}.${field}: no ${resourceType} found with ID \"${value}\".`);
            return false;
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
            this.addError(error);
            return false;
        }
        return true;
    }
    
    // todo - need to validate duplicates that involve more fields that simply ID. e.g. xpindex 
    validateDuplicateIDs(): boolean {
        if (_.isNil(this.currentRecord.ID) || !hasIDProperty(this.currentResource.openAPIProperties)) {
            return true;
        }
        var setEntry: string = this.currentResource.isChild ? `${this.currentRecord[this.currentResource.parentRefFieldName]}/${this.currentRecord.ID}` : this.currentRecord.ID;     
        if (this.idCache.has(this.currentResource.name, setEntry)) {
            var message = `Duplicate ID: multiple ${this.currentResource.name} with ID \"${this.currentRecord.ID}\"`;
            if (setEntry.includes('/')) {
                message = message.concat(` within the ${this.currentResource.parentRefFieldName} \"${this.currentRecord[this.currentResource.parentRefFieldName]}\"`)
            }
            this.addError(message)
            return false;
        } else {
            this.idCache.add(this.currentResource.name, setEntry);
        }
        return true;
    }

    // username needs to be unique within a marketplace
    validateDuplicateUsernames(): boolean {
        var username: string = this.currentRecord.Username;     
        if (_.isNil(username) || !('Username' in this.currentResource.openAPIProperties)) {
            return true;
        }
        if (this.usernameCache.has(username)) {
            var message = `Duplicate Username: multiple users with username \"${username}\"`;
            this.addError(message)
            return false;
        } else {
            this.usernameCache.add(username);
        }
        return true;
    }
}