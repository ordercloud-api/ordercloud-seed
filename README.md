# @ordercloud/seeding
Download and upload serialized representations of full ordercloud organizations

[npm package](https://www.npmjs.com/package/@ordercloud/seeding)

## CLI Usage 

Create a simple B2C organization - `npx @ordercloud/seeding seed Simple-B2C -u-{username} -p={password}`

Create an organization based on a local file - `npx @ordercloud/seeding seed ./folder/seed-data.yml -u-{username} -p={password}`

Create an organization based on a public url - `npx @ordercloud/seeding seed https://raw.githubusercontent.com/ordercloud-api/ordercloud-seed/main/seeds/Simple-B2C.yml -u-{username} -p={password}`

Create a local seed file - `npx @ordercloud/seeding download ./folder/seed-data.yml -e=sandbox -o={existing-org-id} -u-{username} -p={password}`

Validate a local seed file - `npx @ordercloud/seeding validate ./folder/seed-data.yml` 

See options - `npx @ordercloud/seeding --help`

## Supported Organization Templates

These are seeding files maintained as part of this repo that represent templates for common ordercloud use cases. 

| Command Alias | Raw URL |
| --- | --- |                                
| `seed Simple-B2C` | https://raw.githubusercontent.com/ordercloud-api/ordercloud-seed/main/seeds/Simple-B2C.yml |

## Development

- Run `npm install`
- Run `npm run rollup` everytime you change source files.
- Run `node ./cli.js [command]` to debug a command.
- Run `npm run test` to run unit tests.

## To be done

In rough order of priority
1. Publish OS executables 
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
- Anything with an OwnerID (products)

