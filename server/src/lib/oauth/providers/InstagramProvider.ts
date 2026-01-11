/**
 * Instagram OAuth Provider
 * Implements OAuth 2.0 for Instagram Basic Display API
 * 
 * IMPORTANT: Instagram does NOT provide email addresses
 * Must handle account creation differently
 */

import { BaseOAuthProvider } from '../BaseOAuthProvider';
import { OAuthConfig, OAuthUserProfile } from '../types';

export class InstagramProvider extends BaseOAuthProvider {
  readonly name = 'instagram';
  
  constructor() {
    const config: OAuthConfig = {
      clientId: process.env.INSTAGRAM_CLIENT_ID || '',
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
      callbackUrl: process.env.INSTAGRAM_CALLBACK_URL || '',
      scopes: ['user_profile', 'user_media'],
      authorizationUrl: 'https://api.instagram.com/oauth/authorize',
      tokenUrl: 'https://api.instagram.com/oauth/access_token',
      userProfileUrl: 'https://graph.instagram.com/me',
    };
    
    super(config);
  }
  
  /**
   * Get user profile from Instagram Basic Display API
   * NOTE: Email is NOT available from Instagram
   */
  async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    const fields = ['id', 'username', 'account_type', 'media_count'];
    const url = `${this.config.userProfileUrl}?fields=${fields.join(',')}&access_token=${accessToken}`;
    
    const data = await this.makeAuthenticatedRequest<{
      id: string;
      username?: string;
      account_type?: string;
      media_count?: number;
    }>(url, accessToken);
    
    return {
      providerId: data.id,
      email: undefined, // Instagram does not provide email
      displayName: data.username,
      firstName: undefined,
      lastName: undefined,
      profilePicture: undefined, // Not available in Basic Display API
      metadata: {
        instagramId: data.id,
        username: data.username,
        accountType: data.account_type,
        mediaCount: data.media_count,
      },
    };
  }
  
  /**
   * Instagram-specific: Exchange short-lived token for long-lived token
   * Long-lived tokens are valid for 60 days
   */
  async exchangeForLongLivedToken(shortLivedToken: string): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    const params = new URLSearchParams({
      grant_type: 'ig_exchange_token',
      client_secret: this.config.clientSecret,
      access_token: shortLivedToken,
    });
    
    const url = `https://graph.instagram.com/access_token?${params.toString()}`;
    
    try {
      const response = await this.makeAuthenticatedRequest<{
        access_token: string;
        token_type: string;
        expires_in: number;
      }>(url, shortLivedToken);
      
      return {
        access_token: response.access_token,
        expires_in: response.expires_in,
      };
    } catch (error) {
      this.handleOAuthError(error, 'long-lived token exchange');
    }
  }
  
  /**
   * Instagram-specific: Refresh long-lived token
   * Refreshes token before it expires (60 days)
   */
  async refreshLongLivedToken(token: string): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    const params = new URLSearchParams({
      grant_type: 'ig_refresh_token',
      access_token: token,
    });
    
    const url = `https://graph.instagram.com/refresh_access_token?${params.toString()}`;
    
    try {
      const response = await this.makeAuthenticatedRequest<{
        access_token: string;
        token_type: string;
        expires_in: number;
      }>(url, token);
      
      return {
        access_token: response.access_token,
        expires_in: response.expires_in,
      };
    } catch (error) {
      this.handleOAuthError(error, 'long-lived token refresh');
    }
  }
  
  /**
   * Override token exchange to use POST (Instagram requirement)
   */
  async exchangeCodeForToken(
    code: string,
    codeVerifier: string
  ): Promise<import('../types').OAuthTokenResponse> {
    try {
      const formData = new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: this.config.callbackUrl,
        code: code,
      });
      
      const axios = (await import('axios')).default;
      const response = await axios.post(
        this.config.tokenUrl,
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      
      return this.parseTokenResponse(response.data);
    } catch (error) {
      this.handleOAuthError(error, 'token exchange');
    }
  }
}
