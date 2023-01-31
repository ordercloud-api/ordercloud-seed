import { OCResourceEnum } from "./oc-resource-enum";
import { OCResourceMetaData } from "./oc-resources";

export class IDCache {
    private cache: Set<string> = new Set();

    add(resourceType: OCResourceMetaData, resource: any): void {
        let key = this.buildKey(resourceType, resource);
        this.cache.add(key); 
    }

    has(resourceType: OCResourceMetaData, resource: any): boolean {
        let key = this.buildKey(resourceType, resource);
        return this.cache?.has(key) ?? false;
    }

    private buildKey(resourceType: OCResourceMetaData, resource: any) {
        let key = resourceType.name;

        function addFieldToKey(fieldName: string): void {
            key.concat(`-${resource[fieldName]}`)
        }

        addFieldToKey("ID");
        resourceType.routeParamNames.forEach(param => addFieldToKey(param))
        return key;
    }
}