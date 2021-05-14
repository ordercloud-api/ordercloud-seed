import { validate } from '../src/actions/validate';

test('valid yaml should succeed', async () => {
    var errors = await validate("./tests/data/valid.yml");
    expect(errors.length).toBe(0);
});

test('file not found', async () => {
    var errors = await validate("./tests/data/fake.yml");
    expect(errors.length).toBe(1);
    expect(errors[0]).toBe("No such file or directory ./tests/data/fake.yml found")
});

test('not valid yaml', async () => {
    var errors = await validate("./tests/data/bad-yaml.yml");
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain("YAML Exception in ./tests/data/bad-yaml.yml: unexpected end of the stream within a flow collection (2:1)")
});

test('duplicate IDs', async () => {
    var errors = await validate("./tests/data/duplicate-ids.yml");
    expect(errors.length).toBe(1);
    expect(errors[0]).toBe("Duplicate ID: multiple Buyers with ID \"cloud_coffee\"");
});

test('duplicate IDs within buyer', async () => {
    var errors = await validate("./tests/data/duplicate-ids-2.yml");
    expect(errors.length).toBe(1);
    expect(errors[0]).toBe("Duplicate ID: multiple CostCenters with ID \"costcenter\" within the BuyerID \"buyer1\"");
});

test('max string length exceeded', async () => {
    var errors = await validate("./tests/data/max-string-length.yml");
    expect(errors.length).toBe(1);
    expect(errors[0]).toBe("Max string length for Buyers.Name is 100. Found \"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\".");
});

test('invalid date', async () => {
    var errors = await validate("./tests/data/invalid-date.yml");
    expect(errors.length).toBe(1);
    expect(errors[0]).toBe("CreditCards.ExpirationDate should be a date format. Found \"not a date\".");
});

test('minimum number', async () => {
    var errors = await validate("./tests/data/minimum-number.yml");
    expect(errors.length).toBe(1);
    expect(errors[0]).toBe("Minimum for PriceSchedules.MinQuantity is 1. Found -1000.");
});

test('required fields', async () => {
    var errors = await validate("./tests/data/required-fields.yml");
    expect(errors.length).toBe(10);
    expect(errors[0]).toBe("Required field Incrementors.LastNumber: cannot have value undefined.");
    expect(errors[1]).toBe("Required field Incrementors.LeftPaddingCount: cannot have value undefined.");
    expect(errors[2]).toBe("Required field Webhooks.Name: cannot have value undefined.");
    expect(errors[3]).toBe("Required field Webhooks.Url: cannot have value undefined.");
    expect(errors[4]).toBe("Required field Webhooks.HashKey: cannot have value undefined.");
    expect(errors[5]).toBe("Required field ProductFacets.Name: cannot have value undefined.");
    expect(errors[6]).toBe("Required field ProductFacets.MinCount: cannot have value undefined.");
    expect(errors[7]).toBe("Required field ProductAssignments.ProductID: cannot have value undefined.");
    expect(errors[8]).toBe("Required field ProductAssignments.BuyerID: cannot have value undefined.");
    expect(errors[9]).toBe("Invalid reference ProductAssignments.UserGroupID: no UserGroups found with ID \"missing_fields_1\".");
});

test('parent ref', async () => {
    var errors = await validate("./tests/data/parent-ref.yml");
    expect(errors.length).toBe(3);
    expect(errors[0]).toBe("Required field CostCenters.BuyerID: cannot have value undefined.");
    expect(errors[1]).toBe("Incorrect type CostCenters.BuyerID: 123 is integer. Should be string.");
    expect(errors[2]).toBe("Invalid reference CostCenters.BuyerID: no Buyers found with ID \"buyer2\".");
});

test('lots of wrong types', async () => {
    var errors = await validate("./tests/data/lots-of-wrong-types.yml");
    expect(errors.length).toBe(7);
    expect(errors[0]).toBe("Incorrect type SecurityProfiles.ID: false is boolean. Should be string.");
    expect(errors[1]).toBe("Incorrect type SecurityProfiles.Name: 10 is integer. Should be string.");
    expect(errors[2]).toBe("Incorrect type SecurityProfiles.Roles: 3.14 is number. Should be array.");
    expect(errors[3]).toBe("Incorrect type SecurityProfiles.CustomRoles: [object Object] is object. Should be array.");
    expect(errors[4]).toBe("Incorrect type SecurityProfiles.PasswordConfig: should be an object,is an array is array. Should be object.");
    expect(errors[5]).toBe("Required field Buyers.Name: cannot have value undefined.");
    expect(errors[6]).toBe("Incorrect type PriceSchedules.MinQuantity: 5.05 is number. Should be integer.");
});