/**
 * Google OAuth Provider
 * Implements OAuth 2.0 / OpenID Connect for Google Sign-In
 */

import { BaseOAuthProvider } from '../BaseOAuthProvider';
import { OAuthConfig, OAuthUserProfile } from '../types';

export class GoogleProvider extends BaseOAuthProvider {
  readonly name = 'google';
  
  constructor() {
    const config: OAuthConfig = {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
      scopes: ['openid', 'email', 'profile'],
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userProfileUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    };
    
    super(config);
  }
  
  /**
   * Get additional authorization parameters for Google
   */
  protected getAdditionalAuthParams(): Record<string, string> {
    return {
      access_type: 'offline', // Request refresh token
      prompt: 'consent', // Force consent screen to get refresh token
    };
  }
  
  /**
   * Get user profile from Google UserInfo endpoint
   */
  async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    const data = await this.makeAuthenticatedRequest<{
      id: string;
      email?: string;
      verified_email?: boolean;
      name?: string;
      given_name?: string;
      family_name?: string;
      picture?: string;
      locale?: string;
    }>(this.config.userProfileUrl, accessToken);
    
    return {
      providerId: data.id,
      email: data.email,
      displayName: data.name,
      firstName: data.given_name,
      lastName: data.family_name,
      profilePicture: data.picture,
      metadata: {
        googleId: data.id,
        emailVerified: data.verified_email,
        locale: data.locale,
      },
    };
  }
  
  /**
   * Verify Google ID token (alternative to access token)
   * Useful for faster authentication without API call
   */
  async verifyIdToken(idToken: string): Promise<{
    sub: string; // User ID
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
  }> {
    const axios = (await import('axios')).default;
    
    try {
      const response = await axios.get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
      );
      
      return response.data;
    } catch (error) {
      this.handleOAuthError(error, 'ID token verification');
    }
  }
}
