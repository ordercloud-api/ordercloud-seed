import { OCResource } from "./oc-resources";
import fs from 'fs';
import yaml from 'js-yaml';
import { ValidateResponse, log, MessageType } from './validate-response';

export default class SeedFile {
    private file = {
        Objects: {},
        Assignments: {}
    }

    private GetTypeField(resource: OCResource) {
        return resource.isAssignment ? "Assignments" : "Objects";
    } 

    AddRecords(resource: OCResource, records: any[]) {
        var typeField = this.GetTypeField(resource);
        this.file[typeField][resource.name] = this.file[typeField][resource.name] || [];
        this.file[typeField][resource.name].push(...records);
    }

    GetRecords(resource: OCResource): any[] {
        var typeField = this.GetTypeField(resource);
        return this.file?.[typeField]?.[resource.name] || [];
    }

    WriteToYaml(filePath: string) {
        fs.writeFileSync(filePath, yaml.dump(this.file));
    }

    ReadFromYaml(filePath: string, errors: ValidateResponse): boolean {
        var file;
        try {
            file = fs.readFileSync(filePath, 'utf8') // consider switching to streams
            log(`found file: ${filePath}`, MessageType.Success);
        } catch (err) {
            errors.errors.push({ lineNumber: null, message: `No such file or directory ${filePath} found` });
            return false;
        }
        try {
            this.file = yaml.load(file) as any;
            log(`valid yaml: ${filePath}`, MessageType.Success);
        } catch (e) {
            var ex = e as YAMLException;
            errors.errors.push({ lineNumber: ex.mark.line, message: `YAML Exception in ${filePath}: ${ex.message}` })
            return false;
        }
        return true;
    }
}

interface YAMLException {
    name: string; // always "YAMLException"
    reason: string;
    message: string;
    stack: string; 
    mark: YAMLExceptionMark
}

interface YAMLExceptionMark {
    postion: number; 
    line: number;
    column: number;
    snippet: string; 
}