import _ from "lodash";
import { ValidationFunc } from "../../models/oc-resource-metadata";

export const RequiredFieldValidationFunc: ValidationFunc = (context) => {
    if (
        _.isNil(context.currentFieldValue) &&
        context.currentResource.openApiSpec.requiredCreateFields.includes(context.currentFieldName)
    ) {
        context.addError(`Required field ${context.currentResource.name}.${context.currentFieldName}: cannot have value ${context.currentFieldValue}.`);
    }
}