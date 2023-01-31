import _ from "lodash";
import { OCResourceEnum } from "../../models/oc-resource-enum";
import { ValidationFunc } from "../../models/oc-resource-metadata";

export const ApiClientValidationFunc: ValidationFunc = (context) => {
    var defaultContextUsername: string = context.currentRecord["DefaultContextUserName"];
    var orderCheckoutIntegrationEventID: string = context.currentRecord["OrderCheckoutIntegrationEventID"];
    var orderReturnIntegrationEventID: string = context.currentRecord["OrderReturnIntegrationEventID"];

    if (!_.isNil(orderCheckoutIntegrationEventID)) {
        var event = context.marketplaceData.Objects[OCResourceEnum.IntegrationEvents]?.find(x => x.ID === orderCheckoutIntegrationEventID);
        if (event && event.EventType != "OrderCheckout") {
            context.addError(`ApiClient.OrderCheckoutIntegrationEventID cannot have value "${orderCheckoutIntegrationEventID}" because this integration event does not have type "OrderCheckout".`);
        }
    }

    if (!_.isNil(orderReturnIntegrationEventID)) {
        var event = context.marketplaceData.Objects[OCResourceEnum.IntegrationEvents]?.find(x => x.ID === orderReturnIntegrationEventID);
        if (event && event.EventType != "OrderReturn") {
            context.addError(`ApiClient.OrderReturnIntegrationEventID cannot have value "${orderReturnIntegrationEventID}" because this integration event does not have type "OrderReturn".`);
        }
    }

    if (!_.isNil(defaultContextUsername) && !context.usernameCache.has(defaultContextUsername)) {
        context.addError(`Invalid reference ApiClients.DefaultContextUserName: no User, SupplierUser or AdminUser found with Username \"${defaultContextUsername}\".`);
    }
}