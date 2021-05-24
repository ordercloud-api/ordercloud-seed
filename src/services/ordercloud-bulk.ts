import pkg from 'lodash';
import RunThrottled from "./throttler";
import { OCResource } from "../models/oc-resources";
const { flatten, range } = pkg;

export default class OrderCloudBulk {
    static async ListAll(resource: OCResource, ...routeParams: string[]): Promise<any[]> {
        const listFunc = resource.sdkObject[resource.listMethodName] as Function; 

        const page1 = await listFunc(...routeParams, { page: 1, pageSize: 100});

        const additionalPages = range(2, Math.max(page1?.Meta.TotalPages + 1, 2)) as number[];
      
        var results = await RunThrottled(additionalPages, 8, page => listFunc(...routeParams, { page, pageSize: 100 }))

        // combine and flatten items
        return flatten([page1, ...results].map((r) => r.Items));
    }

    static async CreateAll(resource: OCResource, records: any[]): Promise<any[]> {
        const createFunc = resource.sdkObject[resource.createMethodName] as Function;
        if (resource.parentRefField) {
            return await RunThrottled(records, 8, record => {           
                return createFunc(record[resource.parentRefField], record);          
            });
        } else {
            return await RunThrottled(records, 8, record => {          
                return createFunc(record);         
            });
        }
    }
}