import pkg from 'lodash';
import RunThrottled from "./throttler";
import { OCResource } from "../models/oc-resources";
const { flatten, range } = pkg;

export default class OrderCloudBulk {
    static async ListAll(resource: OCResource, ...routeParams: string[]): Promise<any[]> {
        const listFunc = resource.sdkObject[resource.listMethodName] as Function; 

        const queryParams = { page: 1, pageSize: 100, depth: 'all'}; // depth only applies to categories
        const page1 = await listFunc(...routeParams, queryParams);

        const additionalPages = range(2, Math.max(page1?.Meta.TotalPages + 1, 2)) as number[];
      
        var results = await RunThrottled(additionalPages, 8, page => listFunc(...routeParams, { page, pageSize: 100 }))

        // combine and flatten items
        return flatten([page1, ...results].map((r) => r.Items));
    }

    static async CreateAll(resource: OCResource, records: any[]): Promise<any[]> {
        const createFunc = resource.sdkObject[resource.createMethodName] as Function;    
        return await RunThrottled(records, 8, record => {
            if (resource.parentRefField) {          
                return createFunc(record[resource.parentRefField], record);  
            } else {
                return createFunc(record); 
            }       
        })
    }

    static async sleep(t) {
        return new Promise(resolve => setTimeout(resolve, t));
     }
}