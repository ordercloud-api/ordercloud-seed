# ordercloud-seed
Download and upload serialized representations of full organizations

## Project status

This project is still being prototyped. The core OrderCloud team will not have bandwidth to focus on this project until May. Any contributions are very welcome! Reach out to oheywood@four51.com with questions. 

Un-tested download functionality works. This is a good entry point for learning about the project. Here are steps to run that. 
- At the root of the project, create a .env file
```
PORTAL_USERNAME="xxxxxxxx" // username and password you use to login to https://portal.ordercloud.io/
PORTAL_PASSWORD="xxxxxxxx"
ORG_ID="SShyjwitRe4ibpum"  // Organization ID of the data you want to download
OC_ENV="sandbox"           // "sandbox", "staging", or "" for production
```
- Run `npm install`
- Run `npm run download`. This should create a file ordercloud-seed.yml with all the data in your organization. 


## Vision of what needs to be done 

In rough order of priority
- Get a validate (upload) command working that reads a potential upload file and returns any errors
- Get the upload command working.
- Write automated tests of the validate command.
- Create nice CLI entry points to this functionality
- Nice to have features

### Validate 
- Output is a list of errors with lines in the yaml file. If list is empty, validation passes.
- Command looks something like `ordercloud-seed validate {file-path}`
- Import has many error scenarios. Validate catches as many as it can before writing to Ordercloud to prevent a partial success. 
  - Bad Inputs
  - Malformed YAML
  - Malformed Schema
  - Duplicate IDs
  - Wrong type provided for field (use swagger, https://api.ordercloud.io/v1/openapi/v3)
  - Missing required field (use swagger)
  -Broken foriegn key between resources
