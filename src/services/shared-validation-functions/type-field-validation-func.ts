import { OpenAPIProperty, OpenAPIType } from "../../models/open-api";
import { ValidationContext } from "../validation-context";
import _ from "lodash";

// TODO - validate things inside objects or arrays
export const TypeFieldValidationFunc = (context:ValidationContext, spec: OpenAPIProperty): boolean => {
    let value = context.currentFieldValue;
    // todo - need to do this differently. Get a swagger parser library
    if ((spec as any).allOf) {
        spec.type = "object";
    }
    var error: string = null;
    var typeError = `Incorrect type ${context.currentResource.name}.${context.currentFieldName}: ${value} is ${getType(value)}. Should be ${spec.type}.`;
    
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
                    error = `Maximum for ${context.currentResource.name}.${context.currentFieldName} is ${spec.maximum}. Found ${value}.`;
                }
                if ((spec.minimum || -Infinity) > value) {
                    error =  `Minimum for ${context.currentResource.name}.${context.currentFieldName} is ${spec.minimum}. Found ${value}.`;
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
                    error = `Max string length for ${context.currentResource.name}.${context.currentFieldName} is ${spec.maxLength}. Found \"${value}\".`;
                }
                if (spec.format === 'date-time' && !Date.parse(value)) {
                    error = `${context.currentResource.name}.${context.currentFieldName} should be a date format. Found \"${value}\".`;
                }
            }        
            break;      
    }
    if (error !== null) {
        context.addError(error);
        return false;
    }
    return true;
}


function getType(value: any): OpenAPIType {
    if (_.isArray(value)) return 'array';
    if (_.isPlainObject(value)) return 'object';
    if (_.isString(value)) return 'string';
    if (_.isBoolean(value)) return 'boolean'
    if (_.isInteger(value)) return 'integer';
    return 'number';
}