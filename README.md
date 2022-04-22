# @ordercloud/seeding
Download and upload serialized representations of full ordercloud marketplaces. 

[npm package](https://www.npmjs.com/package/@ordercloud/seeding)

## Ways to get started

- For node.js users, install with `npm i @ordercloud/seeding -g` and then run `@ordercloud/seeding --help`.

- Alternatively, node.js users can run without install `npx @ordercloud/seeding --help`.

- Download an executable. Run like `seeding-win.exe --help`.

| Operating System | Executable |
| --- | --- |                                
| Windows | [seeding-win.exe](https://raw.githubusercontent.com/ordercloud-api/ordercloud-seed/main/exe/seeding-win.exe) |
| Mac | [seeding-macos](https://raw.githubusercontent.com/ordercloud-api/ordercloud-seed/main/exe/seeding-macos)  |
| Linux | [seeding-linux](https://raw.githubusercontent.com/ordercloud-api/ordercloud-seed/main/exe/seeding-linux) |


## CLI Usage 

Create a marketplace from a "SimpleB2C" template.
```
seed Simple-B2C -u={username} -p={password}
```

Create a marketplace based on a local file. 
```
seed ./folder/seed-data.yml -u={username} -p={password}
```

Create a marketplace based on a public url.
```
seed https://raw.githubusercontent.com/ordercloud-api/ordercloud-seed/main/seeds/Simple-B2C.yml -u={username} -p={password}
```

Download the data from an existing marketplace to a seed file.
```
download ./folder/new-file-to-create.yml -i={existing-marketplace-id} -u={username} -p={password}
```

Validate that a local file would seed successfully. 
```
validate ./folder/my-file.yml
``` 

## Javascript API Usage

```typescript
import { download, seed, validate } from "@ordercloud/seeding";

await seed({
    portalJWT: "xxxxxx", 
    filePath: "./folder/ordercloud-data.yml",
    logger: (message:string, type: MessageType) => {
         console.log(message)
    }
}); 
 ```
 
 ```
var myData: SerializedMarketplace = { ... }

await seed({
    portalJWT: "xxxxxx", 
    rawData: myData,
    logger: (message:string, type: MessageType) => {
         console.log(message)
    }
}); 
 ```

## Marketplace Templates

These are seeding files maintained as part of this repo that represent templates for common ordercloud use cases. 

| Command Alias | Raw URL |
| --- | --- |                                
| `seed Simple-B2C` | https://raw.githubusercontent.com/ordercloud-api/ordercloud-seed/main/seeds/Simple-B2C.yml |

## Development

- Run `npm install`
- Run `npm build` everytime you change source files.
- Run `node ./dist/cli.js [command]` to debug a command.
- Run `npm run test` to run unit tests.


## Nice to Have features
- Progress bar for import and export commands
- JSON as an option
- Reference other files
- Template variables in YAML for imports. Including allowing OC to define an ID and then applying it later.

