/**
 * OAuth Provider Registry
 * Registers all OAuth provider implementations
 */

import { OAuthProviderFactory } from '../types';
import { FacebookProvider } from './FacebookProvider';
import { InstagramProvider } from './InstagramProvider';
import { GoogleProvider } from './GoogleProvider';
import { MicrosoftProvider } from './MicrosoftProvider';

// Register all providers
OAuthProviderFactory.register('facebook', () => new FacebookProvider());
OAuthProviderFactory.register('instagram', () => new InstagramProvider());
OAuthProviderFactory.register('google', () => new GoogleProvider());
OAuthProviderFactory.register('microsoft', () => new MicrosoftProvider());

// Re-export for convenience
export { FacebookProvider } from './FacebookProvider';
export { InstagramProvider } from './InstagramProvider';
export { GoogleProvider } from './GoogleProvider';
export { MicrosoftProvider } from './MicrosoftProvider';
export { OAuthProviderFactory };
