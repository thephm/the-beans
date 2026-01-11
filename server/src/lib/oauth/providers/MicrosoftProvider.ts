/**
 * Microsoft OAuth Provider
 * Implements OAuth 2.0 for Microsoft Identity Platform (Entra ID)
 */

import { BaseOAuthProvider } from '../BaseOAuthProvider';
import { OAuthConfig, OAuthUserProfile } from '../types';

export class MicrosoftProvider extends BaseOAuthProvider {
  readonly name = 'microsoft';
  
  constructor() {
    // Use 'common' for both personal and work accounts
    // Or use 'organizations' for work/school only
    // Or use 'consumers' for personal accounts only
    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    
    const config: OAuthConfig = {
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      callbackUrl: process.env.MICROSOFT_CALLBACK_URL || '',
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      authorizationUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
      tokenUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      userProfileUrl: 'https://graph.microsoft.com/v1.0/me',
    };
    
    super(config);
  }
  
  /**
   * Get additional authorization parameters for Microsoft
   */
  protected getAdditionalAuthParams(): Record<string, string> {
    return {
      response_mode: 'query', // Return parameters as query string
    };
  }
  
  /**
   * Get user profile from Microsoft Graph API
   */
  async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    const data = await this.makeAuthenticatedRequest<{
      id: string;
      userPrincipalName?: string;
      mail?: string;
      displayName?: string;
      givenName?: string;
      surname?: string;
      jobTitle?: string;
      officeLocation?: string;
      mobilePhone?: string;
    }>(this.config.userProfileUrl, accessToken);
    
    // Get profile photo if available
    let profilePicture: string | undefined;
    try {
      const photoUrl = `${this.config.userProfileUrl}/photo/$value`;
      const axios = (await import('axios')).default;
      const photoResponse = await axios.get(photoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        responseType: 'arraybuffer',
      });
      
      // Convert to base64 data URL
      const base64 = Buffer.from(photoResponse.data, 'binary').toString('base64');
      profilePicture = `data:image/jpeg;base64,${base64}`;
    } catch {
      // Photo not available, ignore
    }
    
    return {
      providerId: data.id,
      email: data.mail || data.userPrincipalName,
      displayName: data.displayName,
      firstName: data.givenName,
      lastName: data.surname,
      profilePicture,
      metadata: {
        microsoftId: data.id,
        userPrincipalName: data.userPrincipalName,
        jobTitle: data.jobTitle,
        officeLocation: data.officeLocation,
        mobilePhone: data.mobilePhone,
      },
    };
  }
}
