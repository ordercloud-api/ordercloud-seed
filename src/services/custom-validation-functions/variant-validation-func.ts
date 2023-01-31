import _ from "lodash";
import { Spec, VariantSpec } from "ordercloud-javascript-sdk";
import { OCResourceEnum } from "../../models/oc-resource-enum";
import { ValidationFunc } from "../../models/oc-resource-metadata";

export const VariantValidationFunc: ValidationFunc = (context) => {
    var variantID: string = context.currentRecord["ID"];
    var productID: string = context.currentRecord["ProductID"]; 
    var actualSpecs: VariantSpec[] = context.currentRecord["Specs"] ?? [];
    var product = context.marketplaceData.Objects[OCResourceEnum.Products]?.find(x => x.ID === productID);

    if (_.isNil(productID) || _.isNil(product)) { return; } // error already addded

    if (actualSpecs.length === 0) {
        return context.addError(`Invalid empty array Variant.Specs on Variant with ID \"${variantID}\": a variant must include at least one Spec.`);
    }

    var assignedSpecIDs = context.marketplaceData.Assignments[OCResourceEnum.SpecProductAssignments]?.filter(x => x.ProductID === productID)?.map(x => x.SpecID) ?? [];
    var expectedSpecs: Spec[] = context.marketplaceData.Objects[OCResourceEnum.Specs]?.filter(x => x.DefinesVariant && assignedSpecIDs.includes(x.ID)) ?? [];
    var alreadySeenSpecIds = [];

    for (var actual of actualSpecs) {
        if (alreadySeenSpecIds.includes(actual.SpecID)) {
            context.addError(`Invalid duplicate SpecID \"${actual.SpecID}\" on Variant with ID \"${variantID}\": each spec should appear only once.`);
        }
        alreadySeenSpecIds.push(actual.SpecID);
        var specMatch = expectedSpecs.find((x => x.ID === actual.SpecID));
        if (!specMatch) {
            context.addError(`Invalid reference Variant.Specs.SpecID on Variant with ID \"${variantID}\": spec ID \"${actual.SpecID}\" does not match an assigned spec with DefinesVariant.`);
        } else {
            var optionMatch = context.idCache.has(OCResourceEnum.SpecOptions, [specMatch.ID, actual.OptionID])
            if (!optionMatch) {
                context.addError(`Invalid reference Variant.Specs.OptionID on Variant with ID \"${variantID}\": no option found with ID \"${actual.OptionID}\" on Spec with ID \"${actual.SpecID}\".`);
            }
        }
    }

    for (var expected of expectedSpecs) {
        var match = actualSpecs.find(x => x.SpecID === expected.ID);
        if (!match) {
            context.addError(`Missing Spec on Variant \"${variantID}\": Specs property must specify an option for Spec with ID \"${expected.ID}\".`);
        }
    }
}