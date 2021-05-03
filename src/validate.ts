import { validate } from "./actions/validate";

validate("./tests/data/duplicateIds.yml").then(resp => {
    resp.writeErrors();
});


