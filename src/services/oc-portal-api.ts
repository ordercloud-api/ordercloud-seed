import { Organizations, Auth, Organization, ApiClients, Configuration } from '@ordercloud/portal-javascript-sdk'
import { PortalAuthentication } from "@ordercloud/portal-javascript-sdk/dist/models/PortalAuthentication";
import _ from 'lodash';
import { Tokens } from 'ordercloud-javascript-sdk';
import { LogCallBackFunc, MessageType } from '../js-api';
import { RefreshTimer } from './util';

export default class OCPortalAPI {
  auth: PortalAuthentication;
  marketplace: Organization;
  private marketplaceID: string;
  private logger: LogCallBackFunc;
  private static readonly TEN_MINUTES = 10 * 60 * 1000;

  constructor(marketplaceID: string, logger: LogCallBackFunc) {
    this.marketplaceID = marketplaceID;
    this.logger = logger;
    Configuration.Set({
      baseApiUrl: "https://portal.ordercloud.io/api/v1"
    })
  }
  async TryAuthIntoMarketplace(): Promise<boolean> {
    if (!this.auth) {
      throw "Please call TryAuthIntoPortal() first.";
    }
    let marketplace: Organization;
    try { 
      marketplace = await this.GetMarketplace();
    } catch {
      this.logger(`Marketplace with ID \"${this.marketplaceID}\" not found`, MessageType.Error)
      return false;
    }  
    await this.GetAndSetMarketplaceToken();
    Configuration.Set({ baseApiUrl: marketplace.CoreApiUrl });
    this.marketplace = marketplace;
    return true;
  }

  async TryCreateOrganization(marketplaceName: string, regionId = "usw"): Promise<boolean> {
    if (!this.auth) {
      throw "Please call TryAuthIntoPortal() first.";
    }
    // Confirm orgID doesn't already exist
    try {
      await this.GetMarketplace();  
      this.logger(`A marketplace with ID \"${this.marketplaceID}\" already exists.`, MessageType.Error);
      return false;
    } catch {}
    // Create Marketplace
    let name = marketplaceName || this.marketplaceID
    try
    {
      var org: Organization = {
        Id: this.marketplaceID,
        Name: name,
        Environment: "Sandbox",
        Region: { Id: regionId},
      };
      await Organizations.Save(this.marketplaceID, org, { accessToken: this.auth.access_token });
    }
    catch(exception)
    {
        this.logger(`Couldn't create marketplace with Name \"${name}\" and ID \"${this.marketplaceID}\" in the region \"${regionId}\" because: \n\"${exception.response.data.Errors[0].Message}\"`, MessageType.Error);
        return false;
    }
    this.logger(`Created new marketplace with Name \"${name}\" and ID \"${this.marketplaceID}\".`, MessageType.Success); 
    return true;
  }

  async TryAuthIntoPortal(username: string, password: string, portalAuth: PortalAuthentication): Promise<boolean> {
    if (!_.isNil(portalAuth)) {
      this.auth = portalAuth;
      return true;
    }
    if (_.isNil(username) || _.isNil(password)) {
      this.logger(`Missing required arguments: username and password`, MessageType.Error);
      return false;
    }
    try {
      this.auth = await Auth.Login(username, password)
      RefreshTimer.set(this.refreshTokenFunc, OCPortalAPI.TEN_MINUTES)
      return true;
    } catch {
      this.logger(`Username \"${username}\" and Password \"${password}\" were not valid`, MessageType.Error);
      return false;
    } 
  }

  private async refreshTokenFunc() {
    this.logger(`Refreshing the access token for Marketplace \"${this.marketplaceID}\". This should happen every 10 mins.`, MessageType.Warn)
    this.auth = await Auth.RefreshToken(this.auth.refresh_token);
    await this.GetAndSetMarketplaceToken();
  }

  private async GetMarketplace(): Promise<Organization> {
    return await Organizations.Get(this.marketplaceID, { accessToken: this.auth.access_token })
  }

  private async GetAndSetMarketplaceToken(): Promise<void> {
    let response = await ApiClients.GetToken(this.marketplaceID, null, { accessToken: this.auth.access_token });
    Tokens.SetAccessToken(response.access_token);
  }
}
