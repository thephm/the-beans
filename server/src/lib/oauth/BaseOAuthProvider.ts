/**
 * Base OAuth Provider Implementation
 * Abstract class with common OAuth 2.0 logic
 */

import axios, { AxiosError } from 'axios';
import {
  IOAuthProvider,
  OAuthConfig,
  OAuthTokenResponse,
  OAuthUserProfile,
} from './types';

export abstract class BaseOAuthProvider implements IOAuthProvider {
  protected config: OAuthConfig;
  
  constructor(config: OAuthConfig) {
    this.config = config;
    this.validateConfig();
  }
  
  abstract readonly name: string;
  
  /**
   * Generate authorization URL with PKCE
   */
  getAuthorizationUrl(state: string, codeChallenge: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.callbackUrl,
      scope: this.config.scopes.join(' '),
      state: state,
      response_type: 'code',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    
    // Add provider-specific parameters
    const additionalParams = this.getAdditionalAuthParams();
    for (const [key, value] of Object.entries(additionalParams)) {
      params.append(key, value);
    }
    
    return `${this.config.authorizationUrl}?${params.toString()}`;
  }
  
  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(
    code: string,
    codeVerifier?: string
  ): Promise<OAuthTokenResponse> {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.config.callbackUrl,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      });

      // Add code_verifier if PKCE is used
      if (codeVerifier) {
        params.append('code_verifier', codeVerifier);
      }
      
      const response = await axios.post(
        this.config.tokenUrl,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        }
      );
      
      return this.parseTokenResponse(response.data);
    } catch (error) {
      this.handleOAuthError(error, 'token exchange');
    }
  }
  
  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      });
      
      const response = await axios.post(
        this.config.tokenUrl,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        }
      );
      
      return this.parseTokenResponse(response.data);
    } catch (error) {
      this.handleOAuthError(error, 'token refresh');
    }
  }
  
  /**
   * Get user profile from provider
   * Must be implemented by each provider
   */
  abstract getUserProfile(accessToken: string): Promise<OAuthUserProfile>;
  
  /**
   * Validate configuration
   */
  validateConfig(): void {
    const required = [
      'clientId',
      'clientSecret',
      'callbackUrl',
      'authorizationUrl',
      'tokenUrl',
      'userProfileUrl',
    ];
    
    for (const field of required) {
      if (!this.config[field as keyof OAuthConfig]) {
        throw new Error(
          `${this.name} OAuth config missing required field: ${field}`
        );
      }
    }
    
    if (!this.config.scopes || this.config.scopes.length === 0) {
      throw new Error(`${this.name} OAuth config must specify scopes`);
    }
  }
  
  /**
   * Parse token response from provider
   * Handles different response formats
   */
  protected parseTokenResponse(data: any): OAuthTokenResponse {
    const accessToken = data.access_token || data.accessToken;
    
    if (!accessToken) {
      throw new Error('Token response missing access_token');
    }
    
    return {
      accessToken,
      refreshToken: data.refresh_token || data.refreshToken,
      expiresIn: data.expires_in || data.expiresIn,
      scope: data.scope?.split(' ') || this.config.scopes,
      tokenType: data.token_type || data.tokenType || 'Bearer',
    };
  }
  
  /**
   * Handle OAuth errors consistently
   */
  protected handleOAuthError(error: unknown, context: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const errorData = axiosError.response?.data as any;
      
      console.error(`OAuth ${context} error:`, {
        provider: this.name,
        status: axiosError.response?.status,
        error: errorData?.error,
        description: errorData?.error_description,
      });
      
      throw new Error(
        `OAuth ${context} failed: ${
          errorData?.error_description || errorData?.error || axiosError.message
        }`
      );
    }
    
    console.error(`OAuth ${context} error:`, error);
    throw new Error(`OAuth ${context} failed`);
  }
  
  /**
   * Get additional authorization parameters
   * Can be overridden by providers for custom params
   */
  protected getAdditionalAuthParams(): Record<string, string> {
    return {};
  }
  
  /**
   * Make authenticated API request to provider
   */
  protected async makeAuthenticatedRequest<T>(
    url: string,
    accessToken: string
  ): Promise<T> {
    try {
      const response = await axios.get<T>(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });
      
      return response.data;
    } catch (error) {
      this.handleOAuthError(error, 'API request');
    }
  }
}
