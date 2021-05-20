# @ordercloud/seeding
Download and upload serialized representations of full ordercloud organizations

[npm package](https://www.npmjs.com/package/@ordercloud/seeding)

## CLI Usage 

`npx @ordercloud/seeding --help`

`npx @ordercloud/seeding download -e=sandbox -o={organizationId} -u-{username} -p={password}`

`npx @ordercloud/seeding validate -f=ordercloud-seed.yml`

** Command `upload` comming.
## Development

- Run `npm install`
- Run `npm run rollup` everytime you change source files.
- Run `node ./cli.js [command]` to debug a command.
- Run `npm run test` to run unit tests.

## Vision of what needs to be done 

In rough order of priority
1. Get the upload command working.
2. Expose functionality in a way that can be consumed by another node project.
3. Nice to have features

 ## Nice to Have features
- Reference other yaml files
- Let OC define an ID and then use it as a variable in the yaml
- Template variables in YAML for imports
- Progress bar for import and export commands
- JSON as an option

## OrderCloud corner cases to beware
- Generate product variants
- Creating Specs - Default OptionID
- Creating Categories - Parent CategoryID
- Catalog-buyer nuances
- Things that are globally unique like ApiClient.ID
- Anything with an OwnerID (products)
- If you delete a buyer are all buyer sub-resources automatically deleted? (e.g.)

