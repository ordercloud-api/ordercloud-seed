import { OCResource } from "./oc-resources";
import { version } from "../../package.json";


export class SerializedMarketplace {
    Meta: MarketplaceMeta = {};
    Objects = {};
    Assignments = {};

    constructor(data = null) {
        this.Meta = data?.Meta || {
            CreatedBySeedingVersion: `${version}`
        };
        this.Objects = data?.Objects || {};
        this.Assignments = data?.Assignments || {}
    }    

    AddRecords<T = any>(resource: OCResource, records: T[]) {
        var typeField = resource.isAssignment ? "Assignments" : "Objects";
        this[typeField][resource.name] = this[typeField][resource.name] || [];
        this[typeField][resource.name].push(...records);
    }

    GetRecords<T = any>(resource: OCResource): T[] {
        var typeField = resource.isAssignment ? "Assignments" : "Objects";
        return this[typeField]?.[resource.name] || [];
    }
}

export interface MarketplaceMeta {
    CreatedBySeedingVersion?: string;
}


