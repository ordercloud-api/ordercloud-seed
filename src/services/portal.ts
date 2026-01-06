import { Organizations, Auth, Organization, ApiClients, Configuration } from '@ordercloud/portal-javascript-sdk'
import { PortalAuthentication } from "@ordercloud/portal-javascript-sdk/dist/models/PortalAuthentication";
import { Auth as OrderCloudAuth, AccessToken, Configuration as OrderCloudConfiguration } from 'ordercloud-javascript-sdk';

export default class PortalAPI {
  constructor() {
    Configuration.Set({
      baseApiUrl: "https://portal.ordercloud.io/api/v1"
    })
  }

  async login(username: string, password: string): Promise<PortalAuthentication> {
    return await Auth.Login(username, password);
  }

  async refreshToken(refreshToken: string): Promise<PortalAuthentication> {
    return await Auth.RefreshToken(refreshToken);
  }

  async loginWithClientCredentials(clientId: string, clientSecret: string, baseUrl: string): Promise<AccessToken> {
    // Set the base URL before making the auth call
    OrderCloudConfiguration.Set({ baseApiUrl: baseUrl });
    // Using FullAccess role for admin-level operations required for seeding
    return await OrderCloudAuth.ClientCredentials(clientSecret, clientId, ['FullAccess']);
  }

  async getOrganizationToken(orgID: string, accessToken: string): Promise<string> {
    return (await ApiClients.GetToken(orgID, null, { accessToken })).access_token;
  }

  async GetOrganization(orgID: string, accessToken: string ): Promise<Organization> {
    return await Organizations.Get(orgID, { accessToken });
  }

  async CreateOrganization(id: string, name: string, accessToken: string, regionId = "usw"): Promise<void> {
    var org: Organization = {
      Id: id,
      Name: name,
      Environment: "Sandbox",
      Region: { Id: regionId},
    };
    await Organizations.Save(id, org, { accessToken });
  }
}
