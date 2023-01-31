import { BulkUploadFunc } from "../../models/oc-resource-metadata";

// Need a custom upload function because the cateogry tree needs to be created one level at a time so ParentID references exist.
export const CategoryUploadFunc: BulkUploadFunc = async (context) => {
    let depthCohort = context.currentRecords.filter(r => r.ParentID === null); // start with top-level
    while (depthCohort.length > 0) {
        // create in groups based on depth in the tree
        var results = await context.ordercloudBulk.CreateAll(context.currentResource, depthCohort);
        // get children of those just created
        depthCohort = context.currentRecords.filter(r => results.some(result => r.ParentID === result.ID));
    }
}