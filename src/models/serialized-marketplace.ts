import { OCResource } from "./oc-resources";

export class SerializedMarketplace {
    Objects = {};
    Assignments = {};

    constructor(data = null) {
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


