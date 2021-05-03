import { BuildResourceDirectory } from "../models/oc-resource-directory";
import { OCResourceEnum } from "../models/oc-resource-enum";
import { OCResource, OpenAPIProperties } from "../models/oc-resources";
import SeedFile from "../models/seed-file";
import { ValidateResponse } from "../models/validate-response";

export async function validate(filePath: string): Promise<ValidateResponse> {
    var response = new ValidateResponse();
    var file = new SeedFile();   
    // validates file is found and is valid yaml
    var success = file.ReadFromYaml(filePath, response); 
    if (!success) return response;


    var directory = await BuildResourceDirectory(true);
    var idSets: { [key in OCResourceEnum]?: Set<any> } = {};
    for (let resource of directory) {
        if (hasIDProperty(resource.openAPIProperties)) {
            idSets[resource.name] = new Set();
            for (let record of file.GetRecords(resource)) {
                if (!!record.ID && hasIDProperty(resource.openAPIProperties)) {
                    validateDuplicateIDs(resource, record, idSets, response);
                }
            }
        }
    }

    // validate forigen key, wrong types, missing fields

    return response;
}

function validateDuplicateIDs(resource: OCResource, record: any, idSets: any, response: ValidateResponse) {
    var setEntry: string = resource.isChild ? `${record[resource.parentRefFieldName]}/${record.ID}` : record.ID;
    if (idSets[resource.name].has(setEntry)) {
        var message = `Duplicate ID: multiple ${resource.name} with ID \"${record.ID}\"`;
        if (setEntry.includes('/')) {
            message = message.concat(` within the ${resource.parentRefFieldName} \"${record[resource.parentRefFieldName]}\"`)
        }
        response.errors.push({ message })
    } else {
        idSets[resource.name].add(setEntry)
    }
}

function hasIDProperty(properties: OpenAPIProperties) {
    return 'ID' in properties;
}