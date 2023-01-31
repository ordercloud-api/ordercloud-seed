import _ from "lodash";
import { ValidationFunc } from "../../models/oc-resource-metadata";

// todo - need to validate duplicates that involve more fields that simply ID. e.g. xpindex 
export const DuplicateUsernameRecordValidationFunc: ValidationFunc = (context) => { 
    var username: string = context.currentRecord.Username;     
    if (_.isNil(username)) {
        return;
    }
    if (context.usernameCache.has(username)) {
        var message = `Duplicate Username: multiple users with username \"${username}\"`;
        context.addError(message)
    } else {
        context.usernameCache.add(username);
    }
}