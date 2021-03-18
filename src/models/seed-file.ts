import { OCResourceEnum } from "./oc-resource-enum.js";
import { OCResource } from "./oc-resources.js";
import fs from 'fs';
import yaml from 'js-yaml';

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

    WriteToYaml() {
        fs.writeFileSync('ordercloud-seed.yml', yaml.dump(this.file));
    }

    ReadFromYaml() {
        this.file = yaml.load(fs.readFileSync('ordercloud-seed.yml', 'utf8')) // consider switching to streams
    }
}