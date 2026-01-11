/**
 * OAuth Service
 * Handles OAuth user creation, account linking, and token management
 */

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { encrypt, decrypt } from '../encryption';
import { OAuthUserProfile, OAuthTokenResponse } from './types';

const prisma = new PrismaClient();

interface CreateUserFromOAuthParams {
  profile: OAuthUserProfile;
  provider: string;
  tokenResponse: OAuthTokenResponse;
}

interface LinkOAuthAccountParams {
  userId: string;
  provider: string;
  profile: OAuthUserProfile;
  tokenResponse: OAuthTokenResponse;
}

/**
 * Find or create user from OAuth profile
 * Returns user and JWT token
 */
export async function findOrCreateUserFromOAuth({
  profile,
  provider,
  tokenResponse,
}: CreateUserFromOAuthParams): Promise<{
  user: any;
  token: string;
  isNewUser: boolean;
}> {
  // First, check if OAuth account already exists
  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId: profile.providerId,
      },
    },
    include: {
      user: true,
    },
  });
  
  if (existingAccount) {
    // Update last used timestamp and tokens
    await updateOAuthTokens(existingAccount.id, tokenResponse);
    
    await prisma.oAuthAccount.update({
      where: { id: existingAccount.id },
      data: { lastUsedAt: new Date() },
    });
    
    // Update last login
    await prisma.user.update({
      where: { id: existingAccount.userId },
      data: { lastLogin: new Date() },
    });
    
    const token = generateJWT(existingAccount.user);
    
    return {
      user: existingAccount.user,
      token,
      isNewUser: false,
    };
  }
  
  // If email provided, check if user exists with that email
  if (profile.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: profile.email },
    });
    
    if (existingUser) {
      // Link OAuth account to existing user
      const result = await linkOAuthAccount({
        userId: existingUser.id,
        provider,
        profile,
        tokenResponse,
      });
      
      return {
        user: existingUser,
        token: result.token,
        isNewUser: false,
      };
    }
  }
  
  // Create new user
  const username = await generateUniqueUsername(profile);
  const email = profile.email || await generatePlaceholderEmail(profile, provider);
  
  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: null, // OAuth users don't have password
      firstName: profile.firstName || profile.displayName?.split(' ')[0] || 'User',
      lastName: profile.lastName || profile.displayName?.split(' ').slice(1).join(' ') || '',
      avatar: profile.profilePicture,
      lastLogin: new Date(),
      oauthAccounts: {
        create: {
          provider,
          providerAccountId: profile.providerId,
          email: profile.email,
          displayName: profile.displayName,
          profilePicture: profile.profilePicture,
          metadata: profile.metadata,
          scope: tokenResponse.scope || [],
          tokens: {
            create: {
              accessToken: encrypt(tokenResponse.accessToken),
              refreshToken: tokenResponse.refreshToken
                ? encrypt(tokenResponse.refreshToken)
                : null,
              tokenType: tokenResponse.tokenType || 'Bearer',
              expiresAt: tokenResponse.expiresIn
                ? new Date(Date.now() + tokenResponse.expiresIn * 1000)
                : null,
              scope: tokenResponse.scope || [],
            },
          },
        },
      },
    },
  });
  
  const token = generateJWT(user);
  
  return {
    user,
    token,
    isNewUser: true,
  };
}

/**
 * Link OAuth account to existing user
 */
export async function linkOAuthAccount({
  userId,
  provider,
  profile,
  tokenResponse,
}: LinkOAuthAccountParams): Promise<{
  account: any;
  token: string;
}> {
  // Check if this OAuth account is already linked to another user
  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId: profile.providerId,
      },
    },
  });
  
  if (existingAccount && existingAccount.userId !== userId) {
    throw new Error('This OAuth account is already linked to another user');
  }
  
  if (existingAccount && existingAccount.userId === userId) {
    // Already linked, just update tokens
    await updateOAuthTokens(existingAccount.id, tokenResponse);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    const token = generateJWT(user!);
    
    return {
      account: existingAccount,
      token,
    };
  }
  
  // Create new OAuth account link
  const account = await prisma.oAuthAccount.create({
    data: {
      userId,
      provider,
      providerAccountId: profile.providerId,
      email: profile.email,
      displayName: profile.displayName,
      profilePicture: profile.profilePicture,
      metadata: profile.metadata,
      scope: tokenResponse.scope || [],
      tokens: {
        create: {
          accessToken: encrypt(tokenResponse.accessToken),
          refreshToken: tokenResponse.refreshToken
            ? encrypt(tokenResponse.refreshToken)
            : null,
          tokenType: tokenResponse.tokenType || 'Bearer',
          expiresAt: tokenResponse.expiresIn
            ? new Date(Date.now() + tokenResponse.expiresIn * 1000)
            : null,
          scope: tokenResponse.scope || [],
        },
      },
    },
  });
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  const token = generateJWT(user!);
  
  return {
    account,
    token,
  };
}

/**
 * Update OAuth tokens for an account
 */
export async function updateOAuthTokens(
  accountId: string,
  tokenResponse: OAuthTokenResponse
): Promise<void> {
  await prisma.oAuthToken.upsert({
    where: { accountId: accountId },
    update: {
      accessToken: encrypt(tokenResponse.accessToken),
      refreshToken: tokenResponse.refreshToken
        ? encrypt(tokenResponse.refreshToken)
        : undefined,
      expiresAt: tokenResponse.expiresIn
        ? new Date(Date.now() + tokenResponse.expiresIn * 1000)
        : null,
      scope: tokenResponse.scope || [],
      lastRefreshedAt: new Date(),
      refreshFailCount: 0, // Reset on successful refresh
    },
    create: {
      accountId: accountId,
      accessToken: encrypt(tokenResponse.accessToken),
      refreshToken: tokenResponse.refreshToken
        ? encrypt(tokenResponse.refreshToken)
        : null,
      tokenType: tokenResponse.tokenType || 'Bearer',
      expiresAt: tokenResponse.expiresIn
        ? new Date(Date.now() + tokenResponse.expiresIn * 1000)
        : null,
      scope: tokenResponse.scope || [],
    },
  });
}

/**
 * Get valid access token (refresh if needed)
 */
export async function getValidAccessToken(
  accountId: string
): Promise<string | null> {
  const account = await prisma.oAuthAccount.findUnique({
    where: { id: accountId },
    include: { tokens: true },
  });
  
  if (!account || !account.tokens) {
    return null;
  }
  
  const token = account.tokens;
  
  // Check if token is still valid
  if (token.expiresAt && token.expiresAt > new Date()) {
    return decrypt(token.accessToken);
  }
  
  // Need to refresh
  if (!token.refreshToken) {
    return null; // Can't refresh
  }
  
  try {
    const { OAuthProviderFactory } = await import('./providers');
    const provider = OAuthProviderFactory.create(account.provider);
    
    const refreshedTokens = await provider.refreshAccessToken(
      decrypt(token.refreshToken)
    );
    
    await updateOAuthTokens(accountId, refreshedTokens);
    
    return refreshedTokens.accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    
    // Increment fail count
    await prisma.oAuthToken.update({
      where: { id: token.id },
      data: {
        refreshFailCount: { increment: 1 },
      },
    });
    
    return null;
  }
}

/**
 * Generate unique username from profile
 */
async function generateUniqueUsername(profile: OAuthUserProfile): Promise<string> {
  let baseUsername = profile.displayName?.toLowerCase().replace(/\s+/g, '') || 'user';
  
  // Remove non-alphanumeric characters
  baseUsername = baseUsername.replace(/[^a-z0-9]/g, '');
  
  // Ensure minimum length
  if (baseUsername.length < 3) {
    baseUsername = `user${baseUsername}`;
  }
  
  // Try base username first
  let username = baseUsername;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.user.findUnique({
      where: { username },
    });
    
    if (!existing) {
      return username;
    }
    
    username = `${baseUsername}${counter}`;
    counter++;
  }
}

/**
 * Generate placeholder email for providers without email (Instagram)
 */
async function generatePlaceholderEmail(
  profile: OAuthUserProfile,
  provider: string
): Promise<string> {
  // Use pattern: username@provider.placeholder
  const base = profile.displayName?.toLowerCase().replace(/\s+/g, '') || profile.providerId;
  return `${base}@${provider}.placeholder`;
}

/**
 * Generate JWT token for user
 */
export function generateJWT(user: any): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d',
  });
}

/**
 * Unlink OAuth account from user
 */
export async function unlinkOAuthAccount(
  userId: string,
  provider: string
): Promise<void> {
  const account = await prisma.oAuthAccount.findUnique({
    where: {
      userId_provider: {
        userId,
        provider,
      },
    },
  });
  
  if (!account) {
    throw new Error('OAuth account not found');
  }
  
  // Check if user has password or other OAuth accounts
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      oauthAccounts: true,
    },
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Prevent unlinking if it's the only auth method
  if (!user.password && user.oauthAccounts.length === 1) {
    throw new Error('Cannot unlink the only authentication method');
  }
  
  await prisma.oAuthAccount.delete({
    where: { id: account.id },
  });
}
