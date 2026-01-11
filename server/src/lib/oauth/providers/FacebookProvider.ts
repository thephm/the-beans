/**
 * Facebook OAuth Provider
 * Implements OAuth 2.0 for Facebook Login
 */

import { BaseOAuthProvider } from '../BaseOAuthProvider';
import { OAuthConfig, OAuthUserProfile } from '../types';

export class FacebookProvider extends BaseOAuthProvider {
  readonly name = 'facebook';
  
  constructor() {
    const config: OAuthConfig = {
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      callbackUrl: process.env.FACEBOOK_CALLBACK_URL || '',
      scopes: ['email', 'public_profile'],
      authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      userProfileUrl: 'https://graph.facebook.com/me',
    };
    
    super(config);
  }
  
  /**
   * Get user profile from Facebook Graph API
   */
  async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    const fields = ['id', 'email', 'name', 'first_name', 'last_name', 'picture'];
    const url = `${this.config.userProfileUrl}?fields=${fields.join(',')}`;
    
    const data = await this.makeAuthenticatedRequest<{
      id: string;
      email?: string;
      name?: string;
      first_name?: string;
      last_name?: string;
      picture?: {
        data?: {
          url?: string;
        };
      };
    }>(url, accessToken);
    
    return {
      providerId: data.id,
      email: data.email,
      displayName: data.name,
      firstName: data.first_name,
      lastName: data.last_name,
      profilePicture: data.picture?.data?.url,
      metadata: {
        facebookId: data.id,
      },
    };
  }
  
  /**
   * Facebook-specific: Exchange short-lived token for long-lived token
   * Should be called after initial token exchange
   */
  async exchangeForLongLivedToken(shortLivedToken: string): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      fb_exchange_token: shortLivedToken,
    });
    
    const url = `${this.config.tokenUrl}?${params.toString()}`;
    
    try {
      const response = await this.makeAuthenticatedRequest<{
        access_token: string;
        expires_in: number;
      }>(url, shortLivedToken);
      
      return response;
    } catch (error) {
      this.handleOAuthError(error, 'long-lived token exchange');
    }
  }
}
