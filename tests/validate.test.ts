import { validate } from '../src/actions/validate';

test('validate1 should succeed', async () => {
    var resp = await validate("./tests/data/validate1.yml");
    expect(resp.isValid()).toBe(true);
});

test('file not found', async () => {
    var resp = await validate("./tests/data/fake.yml");
    expect(resp.isValid()).toBe(false);
    expect(resp.errors[0].message).toBe("No such file or directory ./tests/data/fake.yml found")
});

test('not valid yaml', async () => {
    var resp = await validate("./tests/data/badyaml.yml");
    expect(resp.isValid()).toBe(false);
    expect(resp.errors[0].message).toContain("YAML Exception in ./tests/data/badyaml.yml: unexpected end of the stream within a flow collection (2:1)")
});

test('duplicate IDs', async () => {
    var resp = await validate("./tests/data/duplicateIds.yml");
    expect(resp.isValid()).toBe(false);
    expect(resp.errors[0].message).toBe("Duplicate ID: multiple Buyers with ID \"cloud_coffee\"");
});

test('duplicate IDs within buyer', async () => {
    var resp = await validate("./tests/data/duplicateIds.yml");
    expect(resp.isValid()).toBe(false);
    expect(resp.errors[0].message).toBe("Duplicate ID: multiple Buyers with ID \"cloud_coffee\"");
});