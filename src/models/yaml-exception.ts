export interface YAMLException {
    name: string; // always "YAMLException"
    reason: string;
    message: string;
    stack: string; 
    mark: YAMLExceptionMark
}

export interface YAMLExceptionMark {
    postion: number; 
    line: number;
    column: number;
    snippet: string; 
}