import { OCResource } from "./oc-resources.js";
import fs from 'fs';
import yaml from 'js-yaml';
import { ValidateResponse, log } from './validate-response.js';

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

    ReadFromYaml(filePath: string, errors: ValidateResponse) {
        var file;
        try {
            file = fs.readFileSync(filePath, 'utf8') // consider switching to streams
            log(`found file: ${filePath}`);
        } catch (err) {
            errors.errors.push({ lineNumber: null, message: `No such file or directory ${filePath} found` })
        }
        try {
            this.file = yaml.load(file);
            log(`valid yaml: ${filePath}`);
        } catch (e) {
            var ex = e as YAMLException;
            errors.errors.push({ lineNumber: ex.mark.line, message: `YAML Exception in ${filePath}: ${ex.message}` })
        }
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