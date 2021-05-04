import { validate } from "./actions/validate";

validate("./tests/data/lots-of-wrong-types.yml").then(resp => {
    resp.writeErrors();
});


