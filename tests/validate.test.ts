import { validate } from '../src/commands/validate';
import fs from 'fs';
import yaml, { YAMLException } from 'js-yaml';
import { SerializedMarketplace } from '../src/models/serialized-marketplace';

async function validateFile(path: string) {
    var stringData = fs.readFileSync(path, 'utf8') // consider switching to streams
    var data = yaml.load(stringData) as SerializedMarketplace;
    return await validate({ rawData: data, logger: () => {} })
}

test('valid yaml should succeed', async () => {
    var resp = await validateFile("./tests/data/valid.yml" );
    expect(resp.errors.length).toBe(0);
});

// test('file not found', async () => {
//     var resp = await validateFile("./tests/data/fake.yml");
//     expect(resp.errors.length).toBe(1);
//     expect(resp.errors[0]).toBe("No such file or directory \"./tests/data/fake.yml\" found")
// });

// test('not valid yaml', async () => {
//     var resp = await validateFile("./tests/data/bad-yaml.yml");
//     expect(resp.errors.length).toBe(1);
//     expect(resp.errors[0]).toContain("YAML Exception in \"./tests/data/bad-yaml.yml\": unexpected end of the stream within a flow collection (2:1)")
// });

test('duplicate IDs', async () => {
    var resp = await validateFile("./tests/data/duplicate-ids.yml");
    expect(resp.errors.length).toBe(1);
    expect(resp.errors[0]).toBe("Duplicate ID: multiple Buyers with ID \"cloud_coffee\"");
});

test('duplicate IDs within buyer', async () => {
    var resp = await validateFile("./tests/data/duplicate-ids-2.yml");
    expect(resp.errors.length).toBe(1);
    expect(resp.errors[0]).toBe("Duplicate ID: multiple CostCenters with ID \"costcenter\" within the BuyerID \"buyer1\"");
});

test('max string length exceeded', async () => {
    var resp = await validateFile("./tests/data/max-string-length.yml");
    expect(resp.errors.length).toBe(1);
    expect(resp.errors[0]).toBe("Max string length for Buyers.Name is 100. Found \"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\".");
});

test('invalid date', async () => {
    var resp = await validateFile("./tests/data/invalid-date.yml");
    expect(resp.errors.length).toBe(1);
    expect(resp.errors[0]).toBe("CreditCards.ExpirationDate should be a date format. Found \"not a date\".");
});

test('minimum number', async () => {
    var resp = await validateFile("./tests/data/minimum-number.yml");
    expect(resp.errors.length).toBe(1);
    expect(resp.errors[0]).toBe("Minimum for PriceSchedules.MinQuantity is 1. Found -1000.");
});

test('required fields', async () => {
    var resp = await validateFile("./tests/data/required-fields.yml");
    expect(resp.errors.length).toBe(10);
    expect(resp.errors[0]).toBe("Required field Incrementors.LastNumber: cannot have value undefined.");
    expect(resp.errors[1]).toBe("Required field Incrementors.LeftPaddingCount: cannot have value undefined.");
    expect(resp.errors[2]).toBe("Required field Webhooks.Name: cannot have value undefined.");
    expect(resp.errors[3]).toBe("Required field Webhooks.Url: cannot have value undefined.");
    expect(resp.errors[4]).toBe("Required field Webhooks.HashKey: cannot have value undefined.");
    expect(resp.errors[5]).toBe("Required field ProductFacets.Name: cannot have value undefined.");
    expect(resp.errors[6]).toBe("Required field ProductFacets.MinCount: cannot have value undefined.");
    expect(resp.errors[7]).toBe("Required field ProductAssignments.ProductID: cannot have value undefined.");
    expect(resp.errors[8]).toBe("Required field ProductAssignments.BuyerID: cannot have value undefined.");
    expect(resp.errors[9]).toBe("Invalid reference ProductAssignments.UserGroupID: no UserGroups found with ID \"missing_fields_1\". within the BuyerID \"undefined\"");
});

test('parent ref', async () => {
    var resp = await validateFile("./tests/data/parent-ref.yml");
    expect(resp.errors.length).toBe(3);
    expect(resp.errors[0]).toBe("Required field CostCenters.BuyerID: cannot have value undefined.");
    expect(resp.errors[1]).toBe("Incorrect type CostCenters.BuyerID: 123 is integer. Should be string.");
    expect(resp.errors[2]).toBe("Invalid reference CostCenters.BuyerID: no Buyers found with ID \"buyer2\".");
});

test('lots of wrong types', async () => {
    var resp = await validateFile("./tests/data/lots-of-wrong-types.yml");
    expect(resp.errors.length).toBe(7);
    expect(resp.errors[0]).toBe("Incorrect type SecurityProfiles.ID: false is boolean. Should be string.");
    expect(resp.errors[1]).toBe("Incorrect type SecurityProfiles.Name: 10 is integer. Should be string.");
    expect(resp.errors[2]).toBe("Incorrect type SecurityProfiles.Roles: 3.14 is number. Should be array.");
    expect(resp.errors[3]).toBe("Incorrect type SecurityProfiles.CustomRoles: [object Object] is object. Should be array.");
    expect(resp.errors[4]).toBe("Incorrect type SecurityProfiles.PasswordConfig: should be an object,is an array is array. Should be object.");
    expect(resp.errors[5]).toBe("Required field Buyers.Name: cannot have value undefined.");
    expect(resp.errors[6]).toBe("Incorrect type PriceSchedules.MinQuantity: 5.05 is number. Should be integer.");
});

test('impersonation config: admin user group', async () => {
    var resp = await validateFile("./tests/data/impersonation-config/admin-user-group.yml");
    expect(resp.errors.length).toBe(1);
    expect(resp.errors[0]).toBe("Invalid reference ImpersonationConfigs.ImpersonationGroupID: no AdminUserGroup found with ID \"user-group\".");
});

test('impersonation config: user group', async () => {
    var resp = await validateFile("./tests/data/impersonation-config/user-group.yml");
    expect(resp.errors.length).toBe(2);
    expect(resp.errors[0]).toBe("Invalid reference ImpersonationConfigs.ImpersonationGroupID: no UserGroup found with ID \"admin-user-group\" and BuyerID \"buyer\".");
    expect(resp.errors[1]).toBe("Invalid reference ImpersonationConfigs.ImpersonationGroupID: no UserGroup found with ID \"user-group2\" and BuyerID \"buyer\".");
});

test('api client DefaultContextUserName property', async () => {
    var resp = await validateFile("./tests/data/api-client-defaultcontextusername.yml");
    expect(resp.errors.length).toBe(1);
    expect(resp.errors[0]).toBe("Invalid reference ApiClients.DefaultContextUserName: no User, SupplierUser or AdminUser found with Username \"wrong\".");
});

test('webhook ApiClientIDs property', async () => {
    var resp = await validateFile("./tests/data/webhook-api-clients-prop.yml");
    expect(resp.errors.length).toBe(1);
    expect(resp.errors[0]).toBe("Invalid reference Webhooks.ApiClientIDs: could not find ApiClients with IDs wrong1, wrong2.");
});

test('security profile assignment', async () => {
    var resp = await validateFile("./tests/data/security-profile-assignment.yml");
    expect(resp.errors.length).toBe(4);
    expect(resp.errors[0]).toBe("Invalid reference SecurityProfileAssignment.UserGroupID: no AdminUserGroup found with ID \"user-group\".");
    expect(resp.errors[1]).toBe("SecurityProfileAssignment error: cannot include both a BuyerID and a SupplierID");
    expect(resp.errors[2]).toBe("Invalid reference SecurityProfileAssignment.UserID: no User found with ID \"supplier-user\" and BuyerID \"buyer\".");
    expect(resp.errors[3]).toBe("Invalid reference SecurityProfileAssignment.UserGroupID: no UserGroup found with ID \"user-group2\" and BuyerID \"buyer\".");
});

test('owner ID should be marketplace ID or supplierID', async () => {
    var resp = await validateFile("./tests/data/invalid-owner-id.yml");
    expect(resp.errors.length).toBe(1);
    expect(resp.errors[0]).toBe("Invalid reference Catalog.OwnerID: could not find Supplier with ID \"wrong\"");
});