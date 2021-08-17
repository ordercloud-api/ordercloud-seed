import pkg, { range } from 'lodash';
import { OCResource } from "../models/oc-resources";
import Bottleneck from 'bottleneck';
import chalk from 'chalk';
import _ from 'lodash';
import { OCResourceEnum } from '../models/oc-resource-enum';
const { flatten } = pkg;

export default class OrderCloudBulk {
    limiter: Bottleneck;
    retryWaitScheduleInMS = [1000, 5000];

    constructor(limiter: Bottleneck) {
        this.limiter = limiter;
        this.limiter.on("failed", (error, jobInfo) => {
            if (jobInfo.retryCount < this.retryWaitScheduleInMS.length) {
                // returning a number does a retry in that many milliseconds
                // https://www.npmjs.com/package/bottleneck#retries
                var wait = this.retryWaitScheduleInMS[jobInfo.retryCount];
                console.log(`Job ${jobInfo.options.id} failed. Will retry after ${wait} ms.`)
                return wait; 
            }
            this.throwError(error); 
        });
    }

    private throwError(error: any) {
        console.log(chalk.red("\nERROR: Unexpected error from OrderCloud. This is likely a seeding tool bug. Please create a github issue with your seed file included! https://github.com/ordercloud-api/ordercloud-seed/issues.\n"));
        console.log("Request method:", chalk.green(error.response.config.method.toUpperCase()));
        console.log("Request url:", chalk.green(error.response.config.url));
        console.log("Request data:", chalk.green(error.response.config.data));
        console.log("\nResponse status:", error.status);
        console.log("Response data:", error.errors.Errors[0]);
    }

    async ListAll(resource: OCResource, ...routeParams: string[]): Promise<any[]> {
        const listFunc = resource.sdkObject[resource.listMethodName] as Function; 

        return await this.ListAllWithFunction(resource.name, listFunc, ...routeParams);
    }

    async ListAllWithFunction(resourceName: OCResourceEnum, listFunc: Function, ...routeParams: string[]): Promise<any[]> {
        const queryParams = { page: 1, pageSize: 100, depth: 'all'}; // depth only applies to categories
        const page1 = await listFunc(...routeParams, queryParams);

        const additionalPages = range(2, Math.max(page1?.Meta.TotalPages + 1, 2)) as number[];

        const results = await this.Run(resourceName, additionalPages, (page) => listFunc(...routeParams, { page, pageSize: 100 }))
      
        // combine and flatten items
        return flatten([page1, ...results].map((r) => r.Items));
    }

    async CreateAll(resource: OCResource, records: any[]): Promise<any[]> {
        const createFunc = resource.sdkObject[resource.createMethodName] as Function;   
        return await this.Run(resource.name, records, (record) => {
            if (resource.parentRefField) {          
                return createFunc(record[resource.parentRefField], record);  
            } else {
                return createFunc(record); 
            }
        });
    }

    async Run<T, K>(resourceName: OCResourceEnum, records: T[], func: (arg: T) => Promise<K>): Promise<K[]> {
        if (_.isNil(records)) {
             return [];
        }
        var tasks = []; 

        for (let i = 0; i < records.length; i++) {
            const record = records[i]; 
            var task = this.limiter.schedule({ id: `${resourceName}-${i}`}, () => func(record));
            tasks.push(task);
        }
        return await Promise.all(tasks);
    }
}