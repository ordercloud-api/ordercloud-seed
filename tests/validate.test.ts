import { validate } from '../src/actions/validate';

test('valid yaml should succeed', async () => {
    var resp = await validate("./tests/data/valid.yml");
    expect(resp.isValid()).toBe(true);
    expect(resp.errors.length).toBe(0);
});

test('file not found', async () => {
    var resp = await validate("./tests/data/fake.yml");
    expect(resp.isValid()).toBe(false);
    expect(resp.errors.length).toBe(1);
    expect(resp.errors[0].message).toBe("No such file or directory ./tests/data/fake.yml found")
});

test('not valid yaml', async () => {
    var resp = await validate("./tests/data/bad-yaml.yml");
    expect(resp.isValid()).toBe(false);
    expect(resp.errors.length).toBe(1);
    expect(resp.errors[0].message).toContain("YAML Exception in ./tests/data/bad-yaml.yml: unexpected end of the stream within a flow collection (2:1)")
});

test('duplicate IDs', async () => {
    var resp = await validate("./tests/data/duplicate-ids.yml");
    expect(resp.isValid()).toBe(false);
    expect(resp.errors.length).toBe(1);
    expect(resp.errors[0].message).toBe("Duplicate ID: multiple Buyers with ID \"cloud_coffee\"");
});

test('duplicate IDs within buyer', async () => {
    var resp = await validate("./tests/data/duplicate-ids-2.yml");
    expect(resp.isValid()).toBe(false);    
    expect(resp.errors.length).toBe(1);
    expect(resp.errors[0].message).toBe("Duplicate ID: multiple CostCenters with ID \"costcenter\" within the BuyerID \"buyer1\"");
});

test('max string length exceeded', async () => {
    var resp = await validate("./tests/data/max-string-length.yml");
    expect(resp.isValid()).toBe(false);
    expect(resp.errors.length).toBe(1);
    expect(resp.errors[0].message).toBe("Max string length for Buyers.Name is 100. Found \"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\".");
});

test('invalid date', async () => {
    var resp = await validate("./tests/data/invalid-date.yml");
    expect(resp.isValid()).toBe(false);
    expect(resp.errors.length).toBe(1);
    expect(resp.errors[0].message).toBe("CreditCards.ExpirationDate should be a date format. Found \"not a date\".");
});

test('minimum number', async () => {
    var resp = await validate("./tests/data/minimum-number.yml");
    expect(resp.isValid()).toBe(false);
    expect(resp.errors.length).toBe(1);
    expect(resp.errors[0].message).toBe("Minimum for PriceSchedules.MinQuantity is 1. Found -1000.");
});

test('required fields', async () => {
    var resp = await validate("./tests/data/required-fields.yml");
    expect(resp.isValid()).toBe(false);
    expect(resp.errors.length).toBe(7);
    expect(resp.errors[0].message).toBe("Required field Incrementors.LastNumber: cannot have value undefined.");
    expect(resp.errors[1].message).toBe("Required field Incrementors.LeftPaddingCount: cannot have value undefined.");
    expect(resp.errors[2].message).toBe("Required field Webhooks.Name: cannot have value undefined.");
    expect(resp.errors[3].message).toBe("Required field Webhooks.Url: cannot have value undefined.");
    expect(resp.errors[4].message).toBe("Required field Webhooks.HashKey: cannot have value undefined.");
    expect(resp.errors[5].message).toBe("Required field ProductFacets.Name: cannot have value undefined.");
    expect(resp.errors[6].message).toBe("Required field ProductFacets.MinCount: cannot have value undefined.");
    //expect(resp.errors[7].message).toBe("Required field ProductAssignments.ProductID: cannot have value undefined.");
    //expect(resp.errors[8].message).toBe("Required field ProductAssignments.BuyerID: cannot have value undefined.");
});

test('parent ref', async () => {
    var resp = await validate("./tests/data/parent-ref.yml");
    expect(resp.isValid()).toBe(false);
    expect(resp.errors.length).toBe(3);
    expect(resp.errors[0].message).toBe("Required field CostCenters.BuyerID: cannot have value undefined.");
    expect(resp.errors[1].message).toBe("Incorrect type CostCenters.BuyerID: 123 is integer. Should be string.");
    expect(resp.errors[2].message).toBe("Invalid reference CostCenters.BuyerID: no Buyers found with ID \"buyer2\".");
});

test('lots of wrong types', async () => {
    var resp = await validate("./tests/data/lots-of-wrong-types.yml");
    expect(resp.isValid()).toBe(false);
    expect(resp.errors.length).toBe(7);
    expect(resp.errors[0].message).toBe("Incorrect type SecurityProfiles.ID: false is boolean. Should be string.");
    expect(resp.errors[1].message).toBe("Incorrect type SecurityProfiles.Name: 10 is integer. Should be string.");
    expect(resp.errors[2].message).toBe("Incorrect type SecurityProfiles.Roles: 3.14 is number. Should be array.");
    expect(resp.errors[3].message).toBe("Incorrect type SecurityProfiles.CustomRoles: [object Object] is object. Should be array.");
    expect(resp.errors[4].message).toBe("Incorrect type SecurityProfiles.PasswordConfig: should be an object,is an array is array. Should be object.");
    expect(resp.errors[5].message).toBe("Required field Buyers.Name: cannot have value undefined.");
    expect(resp.errors[6].message).toBe("Incorrect type PriceSchedules.MinQuantity: 5.05 is number. Should be integer.");
});