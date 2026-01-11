/**
 * OAuth Routes
 * Handles OAuth 2.0 authentication flow endpoints
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/requireAuth';
import { generatePKCE, generateRandomString } from '../lib/encryption';
import { OAuthProviderFactory } from '../lib/oauth/providers';
import {
  findOrCreateUserFromOAuth,
  linkOAuthAccount,
  unlinkOAuthAccount,
} from '../lib/oauth/oauthService';

// Import to register providers
import '../lib/oauth/providers';

const router = Router();
const prisma = new PrismaClient();

// Frontend URL for redirects
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * @swagger
 * /api/auth/oauth/{provider}/start:
 *   get:
 *     summary: Start OAuth flow with provider
 *     tags: [OAuth]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [facebook, instagram, google, microsoft]
 *       - in: query
 *         name: link
 *         schema:
 *           type: boolean
 *           description: Set to true to link account to existing user
 *       - in: query
 *         name: redirect
 *         schema:
 *           type: string
 *           description: Frontend URL to redirect after success
 *     responses:
 *       302:
 *         description: Redirect to OAuth provider
 *       400:
 *         description: Invalid provider
 */
router.get('/:provider/start', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { link, redirect } = req.query;
    
    // Validate provider
    if (!OAuthProviderFactory.isSupported(provider)) {
      return res.status(400).json({
        error: 'unsupported_provider',
        message: `Provider '${provider}' is not supported`,
        supportedProviders: OAuthProviderFactory.getSupportedProviders(),
      });
    }
    
    // Generate PKCE parameters
    const { codeVerifier, codeChallenge } = generatePKCE();
    
    // Generate state parameter for CSRF protection
    const state = generateRandomString(32);
    
    // Get user ID if linking (requires authentication)
    let userId: string | undefined;
    if (link === 'true') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        try {
          const jwt = await import('jsonwebtoken');
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'fallback-secret'
          ) as { userId: string };
          userId = decoded.userId;
        } catch {
          // Invalid token, continue without linking
        }
      }
    }
    
    // Store state in database
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await prisma.oAuthState.create({
      data: {
        state,
        provider,
        codeVerifier,
        codeChallenge,
        userId,
        redirectUrl: redirect as string | undefined,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        expiresAt,
      },
    });
    
    // Create provider instance and get authorization URL
    const oauthProvider = OAuthProviderFactory.create(provider);
    const authUrl = oauthProvider.getAuthorizationUrl(state, codeChallenge);
    
    // Redirect user to OAuth provider
    res.redirect(authUrl);
  } catch (error: any) {
    console.error('OAuth start error:', error);
    res.status(500).json({
      error: 'oauth_start_failed',
      message: error.message || 'Failed to start OAuth flow',
    });
  }
});

/**
 * @swagger
 * /api/auth/oauth/{provider}/callback:
 *   get:
 *     summary: OAuth provider callback
 *     tags: [OAuth]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *           description: Error from provider if user denied access
 *     responses:
 *       302:
 *         description: Redirect to frontend with JWT token
 *       400:
 *         description: OAuth error
 */
router.get('/:provider/callback', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { code, state, error, error_description } = req.query;
    
    // Check for provider errors
    if (error) {
      const redirectUrl = `${FRONTEND_URL}/auth/error?error=${error}&description=${error_description || 'OAuth authentication failed'}`;
      return res.redirect(redirectUrl);
    }
    
    // Validate required parameters
    if (!code || !state) {
      return res.redirect(
        `${FRONTEND_URL}/auth/error?error=invalid_callback&description=Missing code or state parameter`
      );
    }

    // TypeScript narrowing - code and state are guaranteed strings here
    const authCode = code as string;
    const authState = state as string;
    
    // Verify state parameter (CSRF protection)
    const stateRecord = await prisma.oAuthState.findUnique({
      where: { state: authState },
    });
    
    if (!stateRecord) {
      return res.redirect(
        `${FRONTEND_URL}/auth/error?error=invalid_state&description=Invalid or expired state parameter`
      );
    }
    
    if (stateRecord.expiresAt < new Date()) {
      await prisma.oAuthState.delete({ where: { id: stateRecord.id } });
      return res.redirect(
        `${FRONTEND_URL}/auth/error?error=expired_state&description=OAuth state expired, please try again`
      );
    }
    
    if (stateRecord.provider !== provider) {
      await prisma.oAuthState.delete({ where: { id: stateRecord.id } });
      return res.redirect(
        `${FRONTEND_URL}/auth/error?error=provider_mismatch&description=Provider mismatch`
      );
    }
    
    // Delete state record (one-time use)
    await prisma.oAuthState.delete({ where: { id: stateRecord.id } });
    
    // Exchange code for tokens
    const oauthProvider = OAuthProviderFactory.create(provider);
    const tokenResponse = await oauthProvider.exchangeCodeForToken(
      authCode,
      stateRecord.codeVerifier ?? undefined
    );
    
    // Get user profile from provider
    const profile = await oauthProvider.getUserProfile(tokenResponse.accessToken);
    
    // Handle account linking vs new user
    let jwtToken: string;
    let isNewUser = false;
    
    if (stateRecord.userId) {
      // Link to existing account
      const result = await linkOAuthAccount({
        userId: stateRecord.userId,
        provider,
        profile,
        tokenResponse,
      });
      jwtToken = result.token;
    } else {
      // Find or create user
      const result = await findOrCreateUserFromOAuth({
        profile,
        provider,
        tokenResponse,
      });
      jwtToken = result.token;
      isNewUser = result.isNewUser;
    }
    
    // Redirect to frontend with JWT
    const redirectUrl = stateRecord.redirectUrl || `${FRONTEND_URL}/auth/callback`;
    const separator = redirectUrl.includes('?') ? '&' : '?';
    const finalUrl = `${redirectUrl}${separator}token=${jwtToken}&isNewUser=${isNewUser}&provider=${provider}`;
    
    res.redirect(finalUrl);
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    const errorMessage = encodeURIComponent(error.message || 'Authentication failed');
    res.redirect(
      `${FRONTEND_URL}/auth/error?error=oauth_callback_failed&description=${errorMessage}`
    );
  }
});

/**
 * @swagger
 * /api/auth/oauth/accounts:
 *   get:
 *     summary: Get user's linked OAuth accounts
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of linked accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accounts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       provider:
 *                         type: string
 *                       email:
 *                         type: string
 *                       displayName:
 *                         type: string
 *                       lastUsedAt:
 *                         type: string
 *                         format: date-time
 */
router.get('/accounts', requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    
    const accounts = await prisma.oAuthAccount.findMany({
      where: { userId },
      select: {
        provider: true,
        email: true,
        displayName: true,
        profilePicture: true,
        lastUsedAt: true,
        createdAt: true,
        scope: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });
    
    res.json({ accounts });
  } catch (error: any) {
    console.error('Get OAuth accounts error:', error);
    res.status(500).json({
      error: 'failed_to_fetch_accounts',
      message: error.message || 'Failed to fetch OAuth accounts',
    });
  }
});

/**
 * @swagger
 * /api/auth/oauth/accounts/{provider}:
 *   delete:
 *     summary: Unlink OAuth account
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account unlinked successfully
 *       400:
 *         description: Cannot unlink (only auth method)
 */
router.delete('/accounts/:provider', requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { provider } = req.params;
    
    await unlinkOAuthAccount(userId, provider);
    
    res.json({
      message: `${provider} account unlinked successfully`,
    });
  } catch (error: any) {
    console.error('Unlink OAuth account error:', error);
    
    if (error.message === 'Cannot unlink the only authentication method') {
      return res.status(400).json({
        error: 'cannot_unlink',
        message: error.message,
      });
    }
    
    res.status(500).json({
      error: 'unlink_failed',
      message: error.message || 'Failed to unlink OAuth account',
    });
  }
});

/**
 * @swagger
 * /api/auth/oauth/providers:
 *   get:
 *     summary: Get list of supported OAuth providers
 *     tags: [OAuth]
 *     responses:
 *       200:
 *         description: List of providers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 providers:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/providers', (req: Request, res: Response) => {
  const providers = OAuthProviderFactory.getSupportedProviders();
  res.json({ providers });
});

export default router;
