import _ from 'lodash';
import { Product, Products, Specs } from 'ordercloud-javascript-sdk';
import { REDACTED_MESSAGE,MARKETPLACE_ID_PLACEHOLDER } from '../constants';
import { MessageType } from '../js-api';
import { JobActionType, JobGroupMetaData } from '../models/job-metadata';
import { OCResourceEnum } from '../models/oc-resource-enum';
import { SeedRunContext } from '../models/seed-run-context';

interface CustomSeedFunctionMap {
    [key: string]: (records: any[], context: SeedRunContext) => Promise<void>
}

export class Seeder {
    private static CustomUploadFuncs: CustomSeedFunctionMap = {
        [OCResourceEnum.ApiClient]: this.ApiClientUploadFunc,
        [OCResourceEnum.Category]: this.CategoryBulkUploadFunc,
        [OCResourceEnum.SpecOption]: this.SpecOptionBulkUploadFunc,
        [OCResourceEnum.Variant]: this.VariantBulkUploadFunc,
    }

    static async seed(context: SeedRunContext): Promise<void> {
        for (let resource of context.directory.listResourceMetadata().sort((a, b) => a.createPriority - b.createPriority)) {
            context.currentResource = resource;
            let records = context.marketplaceData.GetRecords(context.currentResource);
            records.forEach(record => {
                this.ReplaceRedactedFields(record, context);
                this.ReplaceMarketplaceIDReference(record, context);
                this.ReplaceClientIDReference(record, context);
                record = context.currentResource.uploadTransformFunc(record, context);
            });
            let customFunc = this.CustomUploadFuncs[context.currentResource.name]
            if (customFunc) {
                await customFunc(records, context);
            } else {
                await context.ordercloudBulk.CreateAll(context.currentResource, records);
            }
    
            if (records.length != 0) {
                context.logger(`Created ${records.length} ${resource.name}.`, MessageType.Info);
            }   
        }
    }

    // Api Clients ID are globally unique across customers. This presents a challenge for seeding from a template with hard coded values.
    // What the seeding tool does on upload is change the ID values but keep the structure of references the same. 
    // apiClientIDMap translates between these.
    private static ReplaceClientIDReference(record: any, context: SeedRunContext): void {
        context.currentResource.apiClientRefFields.forEach(field => {
            let value = record[field];
            if (_.isNil(value)) {
                return;
            }
            if (_.isArray(value)) {
                // Should be Webhook.ApiClients
                record[field] = value.map(id => context.apiClientIDMap[id])
            } else {
                // Should be OpenIdConnect, ImpersonationConfig, ApiClientAssignment
                record[field] = context.apiClientIDMap[value]
            }
        })
    }

    private static ReplaceMarketplaceIDReference(record: any, context: SeedRunContext): void {
        if (context.currentResource.hasSellerOwnerField) {
            let fieldName = context.currentResource.sellerOwnerReference.fieldNameOnThisResource;
            if (record[fieldName] === MARKETPLACE_ID_PLACEHOLDER) {
                record[fieldName] = context.newMarketplaceID;
            }
        }
    }

    // Fields that are secrets should not be downloaded to a flat file.
    // They are replaced by a hardcoded REDACTED_MESSAGE. Then at seed time, they are replaced with newly generated values.
    private static ReplaceRedactedFields(record: any, context: SeedRunContext): void {
        context.currentResource.redactedFields.forEach(field => {
            if (record[field.field] === REDACTED_MESSAGE) {
                record[field.field] = field.onSeedReplaceBy(context);
            }
        })
    };

    // Need a custom upload function because unlike most resources we actually need the results for something.
    private static async ApiClientUploadFunc(records: any[], context: SeedRunContext): Promise<void> {
        var results = await context.ordercloudBulk.CreateAll(context.currentResource, records);
        // Now that we have created the APIClients, we actually know what their IDs are.  
        for (var i = 0; i < records.length; i++) {
            context.apiClientIDMap[records[i].ID] = results[i].ID;
        }
    }

    // Need a custom upload function because the cateogry tree needs to be created one level at a time so ParentID references exist.
    private static async CategoryBulkUploadFunc(records: any[], context: SeedRunContext): Promise<void> {
        let depthCohort = records.filter(r => r.ParentID === null); // start with top-level
        while (depthCohort.length > 0) {
            // create in groups based on depth in the tree
            var results = await context.ordercloudBulk.CreateAll(context.currentResource, depthCohort);
            // get children of those just created
            depthCohort = records.filter(r => results.some(result => r.ParentID === result.ID));
        }
    }

    // Need a custom upload function because Spec.DefaultOptionID cannot be set until after all options are created.
    private static async SpecOptionBulkUploadFunc(records: any[], context: SeedRunContext): Promise<void> {
        await context.ordercloudBulk.CreateAll(context.currentResource, records);
        // Patch Spec.DefaultOptionID after the options are created.
        await context.ordercloudBulk.RunMany("SpecOption" as any, context.specDefaultOptionIDs, x => Specs.Patch(x.ID, { DefaultOptionID: x.DefaultOptionID }));
    }

    // Need a custom upload function because variants are generated, not created normally.
    private static async VariantBulkUploadFunc(records: any[], context: SeedRunContext): Promise<void> {
        var products = context.marketplaceData.Objects[OCResourceEnum.Product] || [];
        var productsWithVariants = products.filter((p: Product) => p.VariantCount > 0);
        var meta: JobGroupMetaData = {
            resourceName: OCResourceEnum.Variant,
            actionType: JobActionType.CREATE,
        };
        context.ordercloudBulk.RunMany(meta, productsWithVariants, (p: Product) => Products.GenerateVariants(p.ID));
        var variants = context.marketplaceData.Objects[OCResourceEnum.Variant];
        await context.ordercloudBulk.RunMany(meta, variants, (v: any) => {
            var variantID = v.Specs.reduce((acc, spec) => `${acc}-${spec.OptionID}`, v.ProductID);
            return Products.SaveVariant(v.ProductID, variantID, v);
        });
    }
}
