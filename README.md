# @ordercloud/seeding
Download and upload serialized representations of full ordercloud organizations

[npm package](https://www.npmjs.com/package/@ordercloud/seeding)

## CLI Usage 

`npx @ordercloud/seeding --help`

`npx @ordercloud/seeding download -e=sandbox -o={existing-org-id} -u-{username} -p={password}`

Create an org based on a local file.

`npx @ordercloud/seeding upload -o={new-org-id} -u-{username} -p={password} -f="ordercloud-seed.yml"`

`npx @ordercloud/seeding validate -f="ordercloud-seed.yml"`

Create a new org based on a config at a public url. This one is a simple B2C ecommerce site. 

`npx @ordercloud/seeding upload -f="https://raw.githubusercontent.com/ordercloud-api/ordercloud-seed/main/seeds/Simple-B2C.yml" -e=sandbox -o=MyOrganizationID -u=xxxxxxxx -p=xxxxxxxxxxx`
`

## Development

- Run `npm install`
- Run `npm run rollup` everytime you change source files.
- Run `node ./cli.js [command]` to debug a command.
- Run `npm run test` to run unit tests.

## To be done

In rough order of priority
1. Thorough QA
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
- Anything with an OwnerID (products)

