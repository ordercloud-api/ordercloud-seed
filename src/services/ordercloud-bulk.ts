import pkg, { range } from 'lodash';
import { OCResource } from "../models/oc-resources";
import Bottleneck from 'bottleneck';
import chalk from 'chalk';
const { flatten } = pkg;

export default class OrderCloudBulk {
    limiter: Bottleneck;

    constructor(limiter: Bottleneck) {
        this.limiter = limiter;
        this.limiter.on("failed", (message, data) => {
            console.log(chalk.red("\nERROR: Unexpected error from OrderCloud. This is likely a seeding tool bug. Please create a github issue with your seed file included! https://github.com/ordercloud-api/ordercloud-seed/issues.\n"));
            console.log("Request method:", chalk.green(message.response.config.method.toUpperCase()));
            console.log("Request url:", chalk.green(message.response.config.url));
            console.log("Request data:", chalk.green(message.response.config.data));
            console.log("\nResponse status:", message.status);
            console.log("Response data:", message.errors.Errors[0]);
        });
    }

    async ListAll(resource: OCResource, ...routeParams: string[]): Promise<any[]> {
        const listFunc = resource.sdkObject[resource.listMethodName] as Function; 

        const queryParams = { page: 1, pageSize: 100, depth: 'all'}; // depth only applies to categories
        const page1 = await listFunc(...routeParams, queryParams);

        const additionalPages = range(2, Math.max(page1?.Meta.TotalPages + 1, 2)) as number[];

        const results = await this.Run(additionalPages, (page) => listFunc(...routeParams, { page, pageSize: 100 }))
      
        // combine and flatten items
        return flatten([page1, ...results].map((r) => r.Items));
    }

    async CreateAll(resource: OCResource, records: any[]): Promise<any[]> {
        const createFunc = resource.sdkObject[resource.createMethodName] as Function;   
        return await this.Run(records, (record) => {
            if (resource.parentRefField) {          
                return createFunc(record[resource.parentRefField], record);  
            } else {
                return createFunc(record); 
            }
        });
    }

    async Run<T, K>(records: T[], func: (arg: T) => Promise<K>): Promise<K[]> {
        var tasks = []; 

        for (let i = 0; i < records.length; i++) {
            const record = records[i]; 
            var task = this.limiter.schedule(() => func(record));
            tasks.push(task);
        }
        return await Promise.all(tasks);
    }
}