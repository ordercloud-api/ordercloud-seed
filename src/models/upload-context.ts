import { OCResourceDirectory } from "./oc-resource-directory";
import { OCResourceEnum } from "./oc-resource-enum";
import { OCResourceMetaData } from "./oc-resource-metadata";
import { SerializedMarketplace } from "./serialized-marketplace";
import OrderCloudBulk from "../services/ordercloud-bulk";
import Random from "../services/random";
import { LogCallBackFunc } from "../services/logger";

export class UploadContext {
    directory: OCResourceDirectory;
    marketplaceData: SerializedMarketplace;
    logger: LogCallBackFunc;
    ordercloudBulk: OrderCloudBulk;

    currentResource: OCResourceMetaData;
    currentRecords: any[];

    // needed to replace placeholder references on OwnerID fields
    newMarketplaceID: string;
    // needed bc api client ids are globally unique, so must changed on upload
    apiClientIDMap: { [prop: string]: string } = {}; 
    // needed bc Spec.DefaultOptionID must be set after options are created.
    specDefaultOptionIDs: { ID: string, DefaultOptionID: string}[] = [];
    // needed to replace redacted secrets
    webhookSecret: string;

    constructor(newMarketplaceID: string, directory: OCResourceDirectory, marketplaceData: SerializedMarketplace, ordercloudBulk: OrderCloudBulk, logger: LogCallBackFunc) {
        this.newMarketplaceID = newMarketplaceID;
        this.directory = directory;
        this.marketplaceData = marketplaceData;
        this.ordercloudBulk = ordercloudBulk;
        this.logger = logger;
        this.webhookSecret = Random.generateWebhookSecret(); // use one webhook secret for all webhooks, integration events and message senders
    }

    addSpecDefaultOption(specRecord: any): void {
        this.specDefaultOptionIDs.push({ ID: specRecord.ID, DefaultOptionID: specRecord.DefaultOptionID}); // save for later step
    }

    getNewlyCreatedApiClientRecords(): any[] {
        var apiClients = this.marketplaceData.Objects[OCResourceEnum.ApiClients]?.map(apiClient => {
            apiClient.ID = this.apiClientIDMap[apiClient.ID];
            return apiClient;
        });
        return apiClients ?? [];
    }

    async defaultBulkCreate(): Promise<void> {
        await this.ordercloudBulk.CreateAll(this.currentResource, this.currentRecords)
    }
}