# ordercloud-seed
Download and upload serialized representations of full organizations

## Project status

This project is still being prototyped. The core OrderCloud team will not have bandwidth to focus on this project until May. Any contributions are very welcome! Reach out to oheywood@four51.com with questions. 

Un-tested download functionality works. This is a good entry point for learning about the project. Here are steps to run that. 
- At the root of the project, create a .env file
```
PORTAL_USERNAME="xxxxxxxx" // username and password you use to login to https://portal.ordercloud.io/
PORTAL_PASSWORD="Pots5555"
ORG_ID="SShyjwitRe4ibpum"  // Organization ID of the data you want to download
OC_ENV="sandbox"           // "sandbox", "staging", or "" for production
```
- Run `npm install`
- Run `npm run download`. This should create a file ordercloud-seed.yml with all the data in your organization. 
