import { Product, Products } from "ordercloud-javascript-sdk";
import { JobActionType, JobGroupMetaData } from "../../models/job-metadata";
import { OCResourceEnum } from "../../models/oc-resource-enum";
import { BulkUploadFunc } from "../../models/oc-resource-metadata";
import { MessageType } from "../logger";

// Need a custom upload function because variants are generated, not created normally.
export const VariantUploadFunc: BulkUploadFunc = async (context) => {
    var products = context.marketplaceData.Objects[OCResourceEnum.Products] || [];
    var productsWithVariants = products.filter((p: Product) => p.VariantCount > 0);
    var meta: JobGroupMetaData = {
        resourceName: OCResourceEnum.Variants,
        actionType: JobActionType.CREATE,
    };
    context.ordercloudBulk.RunMany(meta, productsWithVariants, (p: Product) => Products.GenerateVariants(p.ID));
    var variants = context.marketplaceData.Objects[OCResourceEnum.Variants];
    await context.ordercloudBulk.RunMany(meta, variants, (v: any) => {
        var variantID = v.Specs.reduce((acc, spec) => `${acc}-${spec.OptionID}`, v.ProductID);
        return Products.SaveVariant(v.ProductID, variantID, v);
    });
    context.logger(`Generated variants for ${productsWithVariants.length} products.`, MessageType.Info);
}