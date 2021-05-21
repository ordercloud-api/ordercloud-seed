import { OCResourceEnum } from "./oc-resource-enum";

export class IDCache {
    private idSets: { [key in OCResourceEnum]?: Set<string> } = {};

    add(resourceType:  OCResourceEnum, key: string): void {
        var set = this.idSets[resourceType]; 
        if (set === undefined) { 
            set = this.idSets[resourceType] = new Set<string>();
        }
        set.add(key); 
    }

    has(resourceType:  OCResourceEnum, key: string): boolean {
        return this.idSets[resourceType]?.has(key) ?? false;
    }
}