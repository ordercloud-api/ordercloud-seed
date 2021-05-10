# @ordercloud/seeding
Download and upload serialized representations of full ordercloud organizations

[npm package](https://www.npmjs.com/package/@ordercloud/seeding)

## CLI Usage 

`npx @ordercloud/seeding download -e=sandbox -o={organizationId} -u-{username} -p={password}`

`npx @ordercloud/seeding download --help`

** Commands `upload` and `validate` comming.
## Development

At the root of the project, create a .env file
```
PORTAL_USERNAME="xxxxxxxx" // username and password you use to login to https://portal.ordercloud.io/
PORTAL_PASSWORD="xxxxxxxx"
ORG_ID="xxxxxxxxxxx"  // Organization ID of the data you want to download
OC_ENV="sandbox"           // "sandbox", "staging", or "" for production
```
- Run `npm install`
- Run `npm run rollup` everytime you change source files.
- Run `node ./cli.js [command]` to debug a command.
- Run `npm run test` to run unit tests.

## Vision of what needs to be done 

In rough order of priority
1. Get a validate command working that reads a potential upload file and returns any errors
2. Get the upload command working.
3. Expose functionality in a way that can be consumed by another node project.
3. Nice to have features

### 1. Validate 

The reason to have a validate command it to prevent partially successfull uploads that leave the org in weird state. Ideally, upload should totally succeed or be blocked in the validate step.

- Output is a list of errors with lines in the yaml file. If list is empty, validation passes.
- Command looks something like `ordercloud-seed validate {file-path}` (note no auth required)  
- Import has many error scenarios. Validate catches as many as it can before writing to Ordercloud to prevent a partial success. 
  - Bad Inputs
  - Malformed YAML
  - Malformed Schema
  - Duplicate IDs
  - Wrong type provided for field (use swagger, https://api.ordercloud.io/v1/openapi/v3)
  - Missing required field (use swagger)
  - Broken foriegn key between resources
  
### 2. Upload 
- First runs validate.
- Then creates a totally new org and creates resources there. This puts off complexity around existing data 
- Use POSTs to create. (except for XpIndices, which has only PUT)
- Order of operations is critical 
- Command looks something like `ordercloud-seed import org-id [path] token`
 
### 5. Nice to Have features
- Reference other yaml files
- Let OC define an ID and then use it as a variable in the yaml
- Template variables in YAML for imports
- Progress bar for import and export commands
- JSON or YAML as an option

## OrderCloud corner cases to beware
- Generate product variants
- Creating Specs - Default OptionID
- Creating Categories - Parent CategoryID
- Catalog-buyer nuances
- Things that are globally unique like ApiClient.ID
- Anything with an OwnerID (products)
- If you delete a buyer are all buyer sub-resources automatically deleted? (e.g.)

