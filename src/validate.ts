import { validate } from "./actions/validate";
import { log, MessageType } from "./models/validate-response";

validate("./tests/data/valid.yml").then(resp => {
    if (resp.isValid()) {
        log("Is Valid!", MessageType.Success);
    } else {
        resp.writeErrors();
    }
});


