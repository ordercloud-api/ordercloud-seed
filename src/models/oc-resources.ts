import { OCResourceEnum } from "./oc-resource-enum.js";
import { ListPage } from "ordercloud-javascript-sdk"
import pkg from 'lodash';
const { flatten, range, chunk } = pkg;

export class OCResource {
    config: OCResourceConfig;

    public constructor(config: OCResourceConfig) {
        // apply defaults if not specified
        config.isAssignment = config.isAssignment || false;
        config.listMethodName = config.listMethodName || (config.isAssignment ? "ListAssignments" : "List");
        //config.createMethodName = config.createMethodName || "Create";
        //config.createForeignKeys = config.createForeignKeys || [];
        config.children = config.children || [];
        config.isChild = config.isChild || false;

        this.config = config;    
    }y
    

    async listAll(...routeParams: string[]): Promise<any[]> {
        const listFunc = this.config.sdkObject[this.config.listMethodName] as Function; 
        const page1 = await listFunc(...routeParams, { page: 1, pageSize: 100})
        const additionalPages = range(2, Math.max(page1?.Meta.TotalPages + 1, 2)) as number[];
      
        var results = await this.RunThrottled(additionalPages, 8, page => listFunc(...routeParams, { page, pageSize: 100 }))

        // combine and flatten items
        return flatten([page1, ...results].map((r) => r.Items));
    }

    async RunThrottled<T, K>(items: T[], maxParallelism: number, asyncAction: (x: T)=> Promise<K>): Promise<K[]>  {
        let results = [];

        const batches = chunk(items, maxParallelism) as T[][];
        for (let batch of batches) {
            const batchResults = await Promise.all(batch.map(asyncAction));
            results = results.concat(batchResults);
        }
      
        return results;
    }
}

export interface OCResourceConfig {
    children?: OCResourceEnum[];
    isChild?: boolean;
    parentRefFieldName?: string; // will be populated if and only if isChild is true
    sdkObject: any;
    isAssignment?: boolean,
    //createPriority: number; // higher numbers need to be created first
    listMethodName?: string;
    //createMethodName?: string;
    //createForeignKeys?: ForeignKey[];
}

export interface ForeignKey {
    resource: OCResourceEnum,
    fieldName: string
}

