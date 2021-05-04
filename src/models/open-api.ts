export interface OpenAPIProperty {
    type: OpenAPIType;
    format : 'int32' | 'float' | 'password' | 'date-time';
    readOnly : boolean;
    maxLength : number;
    default: any;
    minimum: number;
    maximum: number;
}

export type OpenAPIType = 'string' | 'integer' | 'number' | 'boolean' | 'object' | 'array';