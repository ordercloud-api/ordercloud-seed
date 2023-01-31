import { SEPARATOR_FOR_SERIALIZATION } from "../constants";
import { OCResourceDirectory } from "./oc-resource-directory";
import { OCResourceEnum } from "./oc-resource-enum";
import { OCResourceMetaData } from "./oc-resource-metadata";
import { SerializedMarketplace } from "./serialized-marketplace";
import { LogCallBackFunc, MessageType } from "../services/logger";

export class ValidationContext {
    directory: OCResourceDirectory;
    marketplaceData: SerializedMarketplace;
    logger: LogCallBackFunc;

    currentResource: OCResourceMetaData;
    currentRecord: any;
    currentFieldName: string;

    private errors: string[] = [];
    idCache: IDCache;
    usernameCache = new Set<string>();

    constructor(directory: OCResourceDirectory, marketplaceData: SerializedMarketplace, logger: LogCallBackFunc) {
        this.directory = directory;
        this.marketplaceData = marketplaceData;
        this.logger = logger;
        this.idCache = new IDCache(directory);
    }

    get currentFieldValue(): any {
        return this.currentRecord[this.currentFieldName]
    }

    addError(message: string) {
        this.errors.push(message);
        this.logger(message, MessageType.Error)
    }

    getErrors(): string[] {
        return this.errors;
    }
}

class IDCache {
    private idCache = new Set<string>();
    private directory: OCResourceDirectory;
    constructor(directory: OCResourceDirectory) {
        this.directory = directory
    }


    has(resourceName: OCResourceEnum, ids: string[]): boolean {
        let key = resourceName + SEPARATOR_FOR_SERIALIZATION + (ids.join(SEPARATOR_FOR_SERIALIZATION));
        return this.idCache.has(key);
    }

    add(resourceName: OCResourceEnum, record: any): void {
        let resource = this.directory.getResourceMetaData(resourceName);
        if (!resource.hasIDField()) {
            throw "Resource " + resourceName + " does not have an ID field.";
        }
        let ids = resource.getIdentifyingData(record);
        let key = resourceName + SEPARATOR_FOR_SERIALIZATION as string;
        ids.forEach(id => {
            key = key + SEPARATOR_FOR_SERIALIZATION + id[1];
        });
        this.idCache.add(key);
    }
}
