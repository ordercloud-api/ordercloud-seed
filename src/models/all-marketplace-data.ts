import { version } from "../../package.json";
import { OCResourceMetaData } from "./oc-resource-metadata";

export class AllMarketplaceData {
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

    AddRecords<T = any>(resource: OCResourceMetaData, records: T[]) {
        var typeField = resource.isAssignment ? "Assignments" : "Objects";
        this[typeField][resource.name] = this[typeField][resource.name] || [];
        this[typeField][resource.name].push(...records);
    }

    GetRecords<T = any>(resource: OCResourceMetaData): T[] {
        var typeField = resource.isAssignment ? "Assignments" : "Objects";
        return this[typeField]?.[resource.name] || [];
    }
}

export interface MarketplaceMeta {
    CreatedBySeedingVersion?: string;
}


