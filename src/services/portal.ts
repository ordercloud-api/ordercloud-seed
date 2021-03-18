import axios from "axios";
import qs from 'qs';

export default class Portal {
    private static readonly baseUrl = "https://portal.ordercloud.io/api/v1";

    static async login(username: string, password: string): Promise<string> {
        var response = await axios.post(`${this.baseUrl}/oauth/token`, 
            qs.stringify({
                grant_type: "password",
                username: username,
                password: password
            }),
            {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
                }
            }
        )  
        return response.data.access_token;
    }

    static async getOrganizationToken(orgID: string, portalToken: string): Promise<string> {
        var response = await axios.get(`${this.baseUrl}/organizations/${orgID}/token`, 
        {
            headers: {
                'Authorization': `Bearer ${portalToken}`
            }
        });
        return response.data.access_token;
    }

    static async CreateOrganization(org: PortalOrganization, portalToken: string): Promise<void> {
        await axios.put(`${this.baseUrl}/organizations/${org.Id}`, org,
        {
            headers: {
                'Authorization': `Bearer ${portalToken}`
            }
        });
    }
}

export interface PortalOrganization {
    Id: string,
    Name?: string,
    Owner?: PortalUser
    Environment?: string
}

export interface PortalUser {
    Email?: string,
    Username?: string,
    Name?: string,
    CanCreateProductionOrgs?: boolean
}