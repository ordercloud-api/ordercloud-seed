import { Organizations, Auth, Organization, ApiClients, Configuration } from '@ordercloud/portal-javascript-sdk'
import { PortalAuthentication } from "@ordercloud/portal-javascript-sdk/dist/models/PortalAuthentication";

export default class PortalAPI {
    private portalUserToken: string;
    constructor() {
        Configuration.Set({
            baseApiUrl: "https://portal.ordercloud.io/api/v1"
        })
    }

    async login(username: string, password: string): Promise<PortalAuthentication> {
        var resp = await Auth.Login(username, password);
        this.portalUserToken = resp.access_token;
        return resp;
    }

    async getOrganizationToken(orgID: string): Promise<string> {
        return (await ApiClients.GetToken(orgID, null, { accessToken: this.portalUserToken })).access_token;
    }

    async GetOrganization(orgID: string): Promise<Organization> {
        return await Organizations.Get(orgID, { accessToken: this.portalUserToken });
    }

    async CreateOrganization(id: string, name: string): Promise<Organization> {
        var org: Organization = {
            Id: id,
            Name: name,
            Environment: "Sandbox",
            Region: { Id: "usw"}  // US West Azure region
        }
        return await Organizations.Save(id, org, { accessToken: this.portalUserToken });
    }
}