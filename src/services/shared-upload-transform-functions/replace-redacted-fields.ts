import { isContext } from "vm";
import { REDACTED_MESSAGE } from "../../constants";
import { UploadTransformFunc } from "../../models/oc-resource-metadata";

// Fields that are secrets should not be downloaded to a flat file.
// They are replaced by a hardcoded REDACTED_MESSAGE. Then at seed time, they are replaced with newly generated values.
export const ReplaceRedactedFields: UploadTransformFunc = (record, context) => {
    context.currentResource.redactedFields.forEach(field => {
        if (record[field.field] === REDACTED_MESSAGE) {
            record[field.field] = field.onSeedReplaceBy(context);
        }
    })
};