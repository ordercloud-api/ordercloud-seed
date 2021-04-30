import { BuildResourceDirectory } from "./models/oc-resource-directory.js";
import { OCResourceEnum } from "./models/oc-resource-enum.js";
import { OpenAPIProperties } from "./models/oc-resources.js";
import SeedFile from "./models/seed-file.js";
import { ValidateResponse } from "./models/validate-response.js";

async function validate(filePath: string): Promise<ValidateResponse> {
    var response = new ValidateResponse();
    var file = new SeedFile();   
    // validates file is found and is valid yaml
    file.ReadFromYaml(filePath, response); 

    var directory = await BuildResourceDirectory(true);
    var idSets: { [key in OCResourceEnum]?: Set<any> } 
    for (let resource of directory) {
       if (hasIDProperty(resource.openAPIProperties)) {
           
       }
    }

    // validate wrong types, missing fields



    return response;
}

function hasIDProperty(properties: OpenAPIProperties) {
    return 'ID' in properties;
}

var resp = await validate("ordercloud-validate.yml");
resp.writeErrors();

