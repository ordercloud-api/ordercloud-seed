import pkg, { range } from 'lodash';
import { OCResource } from "../models/oc-resources";
import Bottleneck from 'bottleneck';
import chalk from 'chalk';
import _ from 'lodash';
import { OCResourceEnum } from '../models/oc-resource-enum';
import Random from './random';
import {  LogCallBackFunc, MessageType } from './logger';
import { RESET_PROGRESS_BAR_SUFFIX } from '../constants';
const { flatten } = pkg;

export default class OrderCloudBulk {
    logger: LogCallBackFunc
    limiter: Bottleneck;
    currentResource = "";
    currentProgress = 0;
    retryWaitScheduleInMS = [1000, 3000, 7000];

    constructor(limiter: Bottleneck, logger: LogCallBackFunc) {
        this.limiter = limiter;
        this.logger = logger;
        this.limiter.on("done", (jobInfo) => {
            var split = jobInfo.options.id.split("-");
            var resource = split[0];
            var progress = parseInt(split[1]);
            if (progress > 1) {
                var total = parseInt(split[3]);
                if (resource !== this.currentResource) {
                    this.logger(`${resource}-${progress}-${total}-${RESET_PROGRESS_BAR_SUFFIX}`, MessageType.Progress)
                    this.currentProgress = 0; // new resource, reset progress
                } else if (progress > this.currentProgress) {
                    // only show increases, small decreases are possible from concurrancy issues.
                    this.logger(`${resource}-${progress}-${total}`, MessageType.Progress)
                    this.currentProgress = progress;
                }
                this.currentResource = resource;
            }
        });
        
        this.limiter.on("failed", (error, jobInfo) => {
            if (jobInfo.retryCount < this.retryWaitScheduleInMS.length) {
                // returning a number does a retry in that many milliseconds
                // https://www.npmjs.com/package/bottleneck#retries
                var wait = this.retryWaitScheduleInMS[jobInfo.retryCount];
                this.logger(`Job ${jobInfo.options.id} failed ${jobInfo.retryCount} time(s). Will retry after ${wait} ms.`, MessageType.Warn)
                return wait; 
            }
            this.throwError(error); 
        });
        this.limiter = limiter;
    }

    private throwError(error: any) {
        console.log(chalk.red("\nERROR: Unexpected error from OrderCloud. This is likely a seeding tool bug. Please create a github issue with your seed file included! https://github.com/ordercloud-api/ordercloud-seed/issues.\n"));
        console.log("Request method:", chalk.green(error.response.config.method.toUpperCase()));
        console.log("Request url:", chalk.green(error.response.config.url));
        console.log("Request data:", chalk.green(error.response.config.data));
        console.log("Response status:", error.status);
        console.log("Response data:", error.errors.Errors[0]);
    }

    async ListAll(resource: OCResource, ...routeParams: string[]): Promise<any[]> {
        const listFunc = resource.sdkObject[resource.listMethodName] as Function; 

        return await this.ListAllWithFunction(resource.name, listFunc, ...routeParams);
    }

    async ListAllWithFunction(resourceName: OCResourceEnum, listFunc: Function, ...routeParams: string[]): Promise<any[]> {
        const queryParams = { page: 1, pageSize: 100, depth: 'all'}; // depth only applies to categories
        const jobOptions = { id: `${resourceName}-1-of-unknown-${Random.generate(6)}` };

        // use limiter for the first page to take advantage of retries and error handling 
        const page1 = await this.limiter.schedule(jobOptions, () => listFunc(...routeParams, queryParams), null) as any;

        const additionalPages = range(2, Math.max(page1?.Meta.TotalPages + 1, 2)) as number[];

        const results = await this.RunMany(resourceName, additionalPages, (page) => listFunc(...routeParams, { ...queryParams, page }))
      
        // combine and flatten items
        return flatten([page1, ...results].map((r) => r.Items));
    }

    async CreateAll(resource: OCResource, records: any[]): Promise<any[]> {
        const createFunc = resource.sdkObject[resource.createMethodName] as Function;   
        return await this.RunMany(resource.name, records, (record) => {
            if (resource.secondRouteParam) {
                return createFunc(record[resource.parentRefField], record[resource.secondRouteParam], record);  
            } else if (resource.parentRefField) {          
                return createFunc(record[resource.parentRefField], record);  
            } else {
                return createFunc(record); 
            }
        });
    }

    async RunMany<T, K>(resourceName: OCResourceEnum, argForRequests: T[], func: (arg: T) => Promise<K>): Promise<K[]> {
        if (_.isNil(argForRequests)) {
             return [];
        }
        var tasks = []; 

        for (let i = 0; i < argForRequests.length; i++) {
            const record = argForRequests[i]; 
            const jobOptions = { id: `${resourceName}-${i}-of-${argForRequests.length}-${Random.generate(6)}` };
            var task = this.limiter.schedule(jobOptions, () => func(record));
            tasks.push(task);
        }
        return await Promise.all(tasks);
    }
}