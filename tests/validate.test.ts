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
    expect(resp.errors.length).toBe(2);
    expect(resp.errors[0]).toBe("Invalid reference Catalogs.OwnerID: no Suppliers found with ID \"wrong\".");
    expect(resp.errors[1]).toBe("Invalid reference PriceSchedules.OwnerID: no Suppliers found with ID \"so wrong\".");
});

test('locale assignment validation should work', async () => {
    var resp = await validateFile("./tests/data/bad-locale-assignments.yml");
    expect(resp.errors.length).toBe(4);
    expect(resp.errors[0]).toBe("Required field Locales.Currency: cannot have value undefined.");
    expect(resp.errors[1]).toBe("Required field LocaleAssignments.BuyerID: cannot have value undefined.");
    expect(resp.errors[2]).toBe("Invalid reference LocaleAssignments.BuyerID: no Buyers found with ID \"fake\".");
    expect(resp.errors[3]).toBe("Invalid reference LocaleAssignment.UserID: no User found with ID \"user2\" and BuyerID \"buyer1\".");
});

test('price schedule must have at least one price break before it can be assigned to a product.', async () => {
    var resp = await validateFile("./tests/data/product-assignment-missing-price-break.yml");
    expect(resp.errors.length).toBe(2);
    expect(resp.errors[0]).toBe("Invalid reference ProductAssignments.PriceScheduleID: no PriceSchedules found with ID \"productA-US\".");
    expect(resp.errors[1]).toBe("Price Schedule with ID \"productA\": must have at least one valid price break before it can be assigned to a product.");
});

test('partys assigned Locale must match  the price schedules currency', async () => {
    var resp = await validateFile("./tests/data/mismatched-currency-assignment.yml");
    expect(resp.errors.length).toBe(1);
    expect(resp.errors[0]).toBe("ProductAssignments: The party's assigned Locale must match the price schedule's currency. Price Schedule ID: \"productA-CA\". Locale ID: \"CA\".");
});

test('variant validation', async () => {
    var resp = await validateFile("./tests/data/invalid-variant-details.yml");
    expect(resp.errors.length).toBe(7);
    expect(resp.errors[0]).toBe("Required field Variants.ProductID: cannot have value undefined.");
    expect(resp.errors[1]).toBe("Invalid reference Variants.ProductID: no Products found with ID \"productzz\".");
    expect(resp.errors[2]).toBe("Invalid empty array Variant.Specs on Variant with ID \"missing-specs\": a variant must include at least one Spec.");
    expect(resp.errors[3]).toBe("Missing Spec on Variant \"missing-size\": Specs property must specify an option for Spec with ID \"size\".");
    expect(resp.errors[4]).toBe("Invalid reference Variant.Specs.OptionID on Variant with ID \"bad-size-option\": no option found with ID \"XX\" on Spec with ID \"size\".");
    expect(resp.errors[5]).toBe("Invalid duplicate SpecID \"size\" on Variant with ID \"two-entries-for-spec\": each spec should appear only once.");
    expect(resp.errors[6]).toBe("Invalid reference Variant.Specs.SpecID on Variant with ID \"extra-bad-spec\": spec ID \"material\" does not match an assigned spec with DefinesVariant.");
});

test('inventory records validation', async () => {
    var resp = await validateFile("./tests/data/inventory-records.yml");
    expect(resp.errors.length).toBe(3);
    expect(resp.errors[0]).toBe("Required field InventoryRecords.ProductID: cannot have value undefined.");
    expect(resp.errors[1]).toBe("Invalid reference InventoryRecord.AddressID: no Admin Address found with ID \"supplier-address-1\".");
    expect(resp.errors[2]).toBe("Invalid reference InventoryRecord.AddressID: no Address found with ID \"admin-address-2\" under supplier with ID \"supplier1\".");
});

test('both types of inventory records', async () => {
    var resp = await validateFile("./tests/data/using-both-types-of-inventory-records.yml");
    expect(resp.errors.length).toBe(2);
    expect(resp.errors[0]).toBe("Invalid use of InventoryRecords and VariantInventoryRecords on product with ID \"product1\".");
    expect(resp.errors[1]).toBe("Invalid use of InventoryRecords and VariantInventoryRecords on product with ID \"product1\".");
});

test('variant inventory records validation', async () => {
    var resp = await validateFile("./tests/data/variant-inventory-records.yml");
    expect(resp.errors.length).toBe(4);
    expect(resp.errors[0]).toBe("Invalid reference InventoryRecord.AddressID: no Admin Address found with ID \"supplier-address-1\".");
    expect(resp.errors[1]).toBe("Invalid reference VariantInventoryRecord.VariantID: no Variant found with ID \"does not exist\" under product with ID \"product1\".");
    expect(resp.errors[2]).toBe("Missing required property VariantInventoryRecord.VariantID.");
    expect(resp.errors[3]).toBe("Invalid reference InventoryRecord.AddressID: no Address found with ID \"admin-address-2\" under supplier with ID \"supplier1\".");
});

test('api client with bad order return id', async () => {
    var resp = await validateFile("./tests/data/api-client-with-bad-order-return-id.yml");
    expect(resp.errors.length).toBe(3);
    expect(resp.errors[0]).toBe("Invalid reference ApiClients.OrderReturnIntegrationEventID: no IntegrationEvents found with ID \"does-not-exist\".");
    expect(resp.errors[1]).toBe("ApiClient.OrderCheckoutIntegrationEventID cannot have value \"return\" because this integration event does not have type \"OrderCheckout\".");
    expect(resp.errors[2]).toBe("ApiClient.OrderReturnIntegrationEventID cannot have value \"checkout\" because this integration event does not have type \"OrderReturn\".");
});

test('seller approval rules', async () => {
    var resp = await validateFile("./tests/data/seller-approval-rules.yml");
    expect(resp.errors.length).toBe(2);
    expect(resp.errors[0]).toBe("Invalid reference SellerApprovalRule.ApprovingGroupID: no User Group found with ID \"supplier-group-2\" under supplier with ID \"supplier1\".");
    expect(resp.errors[1]).toBe("Invalid reference SellerApprovalRule.ApprovingGroupID: no Admin User Group found with ID \"supplier-group-1\".");
});

test('xp different data types', async () => {
    var resp = await validateFile("./tests/data/xp-different-data-types.yml");
    expect(resp.errors.length).toBe(0);
});

test('product ShipFromAddressID validation', async () => {
    var resp = await validateFile("./tests/data/product-shipfromaddressid.yml");
    expect(resp.errors.length).toBe(3);
    expect(resp.errors[0]).toBe("Invalid reference Product.ShipFromAddressID: no Supplier Address found with ID \"supplier-address-1\" under DefaultSupplierID \"supplier-2\".");
    expect(resp.errors[1]).toBe("Invalid reference Product.ShipFromAddressID: no Admin Address found with ID \"supplier-address-1\".");
    expect(resp.errors[2]).toBe("Invalid reference Product.ShipFromAddressID: no Supplier Address found with ID \"admin-address-1\" under DefaultSupplierID \"supplier-1\".");
});

test('ID field character validation', async () => {
    var resp = await validateFile("./tests/data/invalid-id-characters.yml");
    expect(resp.errors.length).toBe(8);
    expect(resp.errors[0]).toBe("Invalid ID value \"U S\". ID can only contain characters Aa-Zz 0-9 - _");
    expect(resp.errors[1]).toBe("Invalid ID value \"US!\". ID can only contain characters Aa-Zz 0-9 - _");
});
