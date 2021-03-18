import { OCResourceEnum } from "./oc-resource-enum.js";
import { OCResource } from "./oc-resources.js";
import fs from 'fs';
import yaml from 'js-yaml';

export default class SeedFile {
    private file = {
        Objects: {},
        Assignments: {}
    }

    AddRecords(resourceName: OCResourceEnum, resource: OCResource, records: any[]) {
        var typeField = resource.config.isAssignment ? "Assignments" : "Objects";
        this.file[typeField][resourceName] = this.file[typeField][resourceName] || [];
        this.file[typeField][resourceName].push(...records);
    }

    WriteToYaml() {
        fs.writeFileSync('ordercloud-seed.yml', yaml.dump(this.file));
    }
}