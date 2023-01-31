import { BuildOCResourceDirectory } from "../models/oc-resource-directory";
import { SerializedMarketplace } from "../models/serialized-marketplace";
import _ from 'lodash';
import { defaultLogger, LogCallBackFunc, MessageType } from "../services/logger";
import axios from "axios";
import yaml, { YAMLException } from 'js-yaml';
import { ValidationContext } from "../models/validation-context";
import { DuplicateIDRecordValidationFunc } from "../services/shared-validation-functions/duplicate-id-record-validation-func";
import { DuplicateUsernameRecordValidationFunc } from "../services/shared-validation-functions/duplicate-username-record-validation-func";
import { RequiredFieldValidationFunc } from "../services/shared-validation-functions/required-field-validation-func";
import { TypeFieldValidationFunc } from "../services/shared-validation-functions/type-field-validation-func";
import { IDCharacterFieldValidationFunc } from "../services/shared-validation-functions/id-characters-field-validation-func";
import { OwnerRefFieldValidationFunc } from "../services/shared-validation-functions/owner-ref-field-validation-func";
import { ReferenceFieldValidationFunc } from "../services/shared-validation-functions/reference-field-validation-func";
import { ParentRefFieldValidationFunc } from "../services/shared-validation-functions/parent-ref-field-validation-func";
import { OpenAPIProperties } from "../models/open-api";

export interface ValidateResponse {
    errors: string[];
    isValid: boolean;
    rawData: SerializedMarketplace
}

export interface ValidateArgs {
    rawData?: SerializedMarketplace;
    dataUrl?: string;
    logger?: LogCallBackFunc
}

export async function validate(args: ValidateArgs): Promise<ValidateResponse> {
    var { 
        rawData,
        dataUrl,
        logger = defaultLogger
    } = args;
    if (_.isNil(rawData)) {
        // validates file is found and is valid yaml
        var stringData: string;   
        try {
            stringData = (await axios.get(dataUrl)).data;
            logger(`Found marketplace data at url \"${dataUrl}\".`, MessageType.Success);
        } catch {
            logger(`Error repsonse from url \"${dataUrl}\" when trying to find marketplace data.`, MessageType.Error);
            return null;
        }
        try {
            rawData = yaml.load(stringData) as SerializedMarketplace;
            logger(`Valid yaml in \"${dataUrl}\"`, MessageType.Success);
        } catch (e) {
            var ex = e as YAMLException;
            logger(`YAML Exception in \"${dataUrl}\": ${ex.message}`, MessageType.Error)
            return null;
        }
    } 

    var directory = await BuildOCResourceDirectory();
    var marketplace = new SerializedMarketplace(rawData);
    var context = new ValidationContext(directory, marketplace, logger);
    // validate duplicate IDs 
    for (let resource of directory.listResourceMetadata()) {
        context.currentResource = resource;
        var hasUsername = context.currentResource.hasUsernameField();
        var hasID = context.currentResource.hasIDField();
        if (hasID || hasUsername) {         
            for (let record of marketplace.GetRecords(resource)) {
                context.currentRecord = record;   
                if (hasID) {
                    // this step builds context.idCache, needed for reference validation. This why there are 2 top-level loops             
                    DuplicateIDRecordValidationFunc(context); 
                } 
                if (hasUsername) {
                    // this step builds context.usernameCache 
                    DuplicateUsernameRecordValidationFunc(context);
                } 
            }
        }
    }

    // now that idSets are built, another loop for the rest of validation
    for (let resource of directory.listResourceMetadata()) {
        context.currentResource = resource
        for (let record of marketplace.GetRecords(resource)) {
            context.currentRecord = record;
            let fields: OpenAPIProperties = resource.openApiSpec.resourceSchema.properties;
            for (const [propName, spec] of Object.entries(fields)) {
                context.currentFieldName = propName;
                if (spec.readOnly) {
                    continue;
                }
                if (_.isNil(context.currentFieldValue)) {
                    RequiredFieldValidationFunc(context);
                } else {
                    var typeMatches = TypeFieldValidationFunc(context, spec);
                    if (typeMatches) {
                        IDCharacterFieldValidationFunc(context);
                        OwnerRefFieldValidationFunc(context)
                        ReferenceFieldValidationFunc(context);
                        ParentRefFieldValidationFunc(context);
                    }
                }
            }
            context.currentResource.customRecordValidationFunc(context); 
        }
    }
    let errors = context.getErrors();
    let isValid = errors.length === 0
    if (isValid) {
        logger("Data validated and ready for seeding.", MessageType.Success);
    }

    return { errors, isValid, rawData: marketplace };
}