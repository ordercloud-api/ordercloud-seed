import { Specs } from "ordercloud-javascript-sdk";
import { BulkUploadFunc } from "../../models/oc-resource-metadata";

// Need a custom upload function because Spec.DefaultOptionID cannot be set until after all options are created.
export const SpecOptionClientUploadFunc: BulkUploadFunc = async (context) => {
    await context.defaultBulkCreate();
    // Patch Spec.DefaultOptionID after the options are created.
    await context.ordercloudBulk.RunMany("SpecOption" as any, context.specDefaultOptionIDs, x => Specs.Patch(x.ID, { DefaultOptionID: x.DefaultOptionID }));
}