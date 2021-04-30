export interface OpenAPIProperty {
    type: 'string' | 'integer' | 'number' | 'boolean' | 'object' | 'array';
    format : 'int32' | 'float' | 'password' | 'date-time';
    readOnly : boolean;
    maxLength : number;
    default: any;
    minimum: number;
    maximum: number;
}