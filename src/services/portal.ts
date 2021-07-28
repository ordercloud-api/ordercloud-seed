import { Organizations, Auth, Organization, ApiClients, Configuration } from '@ordercloud/portal-javascript-sdk'
import { PortalAuthentication } from "@ordercloud/portal-javascript-sdk/dist/models/PortalAuthentication";

export default class PortalAPI {
    constructor() {
        Configuration.Set({
            baseApiUrl: "https://portal.ordercloud.io/api/v1"
        })
    }

    async login(username: string, password: string): Promise<PortalAuthentication> {
        return await Auth.Login(username, password);
    }

    async getOrganizationToken(orgID: string, accessToken: string): Promise<string> {
        return (await ApiClients.GetToken(orgID, null, { accessToken })).access_token;
    }

    async GetOrganization(orgID: string, accessToken: string ): Promise<Organization> {
        return await Organizations.Get(orgID, { accessToken });
    }

    async CreateOrganization(id: string, name: string, accessToken: string): Promise<void> {
        var org: Organization = {
            Id: id,
            Name: name,
            Environment: "Sandbox",
            Region: { Id: "usw"}  // US West Azure region
        }
        await Organizations.Save(id, org, { accessToken });
    }
}