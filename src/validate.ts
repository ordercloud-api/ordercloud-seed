import { validate } from "./actions/validate";
import { log, MessageType } from "./services/log";

validate("./tests/data/required-fields.yml").then(resp => {
    for (const error of resp) {
        log(error, MessageType.Error)
    }
    if (resp.length === 0) {
        log("Is Valid!", MessageType.Success);
    }
});


