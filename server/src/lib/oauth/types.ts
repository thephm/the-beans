/**
 * OAuth Provider Interface
 * All OAuth providers must implement this interface for consistent handling
 */

export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number; // Seconds until expiration
  scope?: string[];
  tokenType?: string;
}

export interface OAuthUserProfile {
  providerId: string; // Unique ID from provider
  email?: string; // May be null for Instagram
  displayName?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  metadata?: Record<string, any>; // Provider-specific data
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  scopes: string[];
  authorizationUrl: string;
  tokenUrl: string;
  userProfileUrl: string;
}

/**
 * Base OAuth Provider Interface
 */
export interface IOAuthProvider {
  /**
   * Provider name (e.g., 'facebook', 'google')
   */
  readonly name: string;
  
  /**
   * Generate authorization URL for OAuth flow
   * @param state - CSRF protection state parameter
   * @param codeChallenge - PKCE code challenge
   * @returns Authorization URL to redirect user to
   */
  getAuthorizationUrl(state: string, codeChallenge: string): string;
  
  /**
   * Exchange authorization code for access token
   * @param code - Authorization code from callback
   * @param codeVerifier - PKCE code verifier (optional)
   * @returns Token response with access/refresh tokens
   */
  exchangeCodeForToken(
    code: string,
    codeVerifier?: string
  ): Promise<OAuthTokenResponse>;
  
  /**
   * Get user profile from provider
   * @param accessToken - OAuth access token
   * @returns User profile data
   */
  getUserProfile(accessToken: string): Promise<OAuthUserProfile>;
  
  /**
   * Refresh access token using refresh token
   * @param refreshToken - OAuth refresh token
   * @returns New token response
   */
  refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse>;
  
  /**
   * Validate provider configuration
   * @throws Error if configuration is invalid or missing
   */
  validateConfig(): void;
}

/**
 * OAuth Provider Factory
 * Creates provider instances based on provider name
 */
export class OAuthProviderFactory {
  private static providers = new Map<string, () => IOAuthProvider>();
  
  /**
   * Register a provider implementation
   */
  static register(name: string, factory: () => IOAuthProvider): void {
    this.providers.set(name.toLowerCase(), factory);
  }
  
  /**
   * Create provider instance
   * @param name - Provider name (e.g., 'facebook', 'google')
   * @returns Provider instance
   * @throws Error if provider not found
   */
  static create(name: string): IOAuthProvider {
    const factory = this.providers.get(name.toLowerCase());
    
    if (!factory) {
      throw new Error(`OAuth provider '${name}' not found`);
    }
    
    return factory();
  }
  
  /**
   * Check if provider is supported
   */
  static isSupported(name: string): boolean {
    return this.providers.has(name.toLowerCase());
  }
  
  /**
   * Get list of supported provider names
   */
  static getSupportedProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}
