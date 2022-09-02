import { OCResourceEnum } from "./oc-resource-enum";

export enum JobActionType {
    LIST = "LIST",
    CREATE = "CREATE"
}

export interface JobGroupMetaData {
    actionType: JobActionType;
    resourceName: OCResourceEnum;
    parentResourceName?: OCResourceEnum;
    parentResourceID?: string; 
}

export class JobMetaData {
    actionType: JobActionType;
    resourceName: OCResourceEnum;
    parentResourceName?: OCResourceEnum;
    parentResourceID?: string; 
    progress: number;
    total: number;

    constructor(jobGroup: JobGroupMetaData, progress: number, total: number) {
        this.actionType = jobGroup.actionType;
        this.resourceName = jobGroup.resourceName;
        this.parentResourceName = jobGroup.parentResourceName;
        this.parentResourceID = jobGroup.parentResourceID;
        this.progress = progress;
        this.total = total;
    }

    static fromString(str: string): JobMetaData {
        var split = str.split("-");
        var jobGroup = {
            actionType: split[0] as any,
            resourceName: split[1] as any,
            parentResourceName: split[2] as any,
            parentResourceID: split[3]
        }
        var meta = new JobMetaData(jobGroup, parseInt(split[4]), parseInt(split[5])); 
        return meta;
    }

    toString(): string {
        return `${this.actionType}-${this.resourceName}-${this.parentResourceName}-${this.parentResourceID}-${this.progress}-${this.total}`;
    }
}