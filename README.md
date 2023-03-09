# @ordercloud/seeding
A CLI to download and upload serialized representations of full [ordercloud](https://ordercloud.io/) marketplaces. 

[npm package](https://www.npmjs.com/package/@ordercloud/seeding)

## Ways to get started

- For node.js users, install with `npm i @ordercloud/seeding -g` and then run `seeding --help`.
    - Alternatively, node.js users can run without install `npx @ordercloud/seeding --help`.

- For docker users `docker run --mount type=bind,source=<local directory>,target=/app oliverheywood/ordercloud-seeding --help`.
    - Subsitute `<local directory>` for an absolute path in order for local file reading and writing to be mounted on the container. 

- Download an executable. Run like `./seeding-win.exe --help`.

| Operating System | Executable |
| --- | --- |                                
| Windows | [seeding-win.exe](https://raw.githubusercontent.com/ordercloud-api/ordercloud-seed/main/exe/seeding-win.exe) |
| Mac | [seeding-macos](https://raw.githubusercontent.com/ordercloud-api/ordercloud-seed/main/exe/seeding-macos)  |
| Linux | [seeding-linux](https://raw.githubusercontent.com/ordercloud-api/ordercloud-seed/main/exe/seeding-linux) |


## CLI Usage 

Create a marketplace from a "Simple-B2C" template.
```
npx @ordercloud/seeding seed Simple-B2C -u={username} -p={password}
```

Create a marketplace based on data in a local file. Looks for files based on the directory the command is run from.
```
npx @ordercloud/seeding seed seed-data-file.yml -u={username} -p={password}
```

Create a marketplace based on a public url.
```
npx @ordercloud/seeding seed https://raw.githubusercontent.com/ordercloud-api/ordercloud-seed/main/seeds/Simple-B2C.yml -u={username} -p={password}
```

Download the data from an existing marketplace to a seed file.
```
npx @ordercloud/seeding download new-file-to-create.yml -i={existing-marketplace-id} -u={username} -p={password}
```

Validate that a local file would seed successfully. 
```
npx @ordercloud/seeding validate my-file.yml
``` 

## Javascript API Usage
 
 ```typescript
import { download, seed, validate, SerializedMarketplace } from "@ordercloud/seeding";


var myData: SerializedMarketplace = { ... };

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
- Run `npm run build` everytime you change source files.
- Run `node ./dist/cli.js [command]` to debug a command.
- Run `npm run test` to run unit tests.


## Nice to Have features
- JSON as an option
- Reference other files
- Template variables in YAML for imports. Including allowing OC to define an ID and then applying it later.

## Steps to release new version
> Note: You must have node version 16 to build the package, you will get errors on node v17 and higher

1. Make your code changes
2. Run `npm run build` to build the code
3. Run `npm run test` to run the unit tests against your built code
4. Run `npm run pkg` to generate the executables (The following warning can be safely ignored: Warning Cannot resolve 'config.)
5. Update "version" field in package.json ([use semver](https://semver.org/))
6. Commit all changes and push to master
7. Create a git release/tag
8. Run `npm publish`