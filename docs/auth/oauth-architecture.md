# OAuth 2.0 Architecture Design

## Overview

This document describes the OAuth 2.0 authentication architecture for The Beans application, supporting multiple OAuth providers (Meta/Facebook, Instagram, Google, Microsoft) with a unified backend implementation.

## Architecture Diagram (Text-Based)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js)                         │
│  - Initiates OAuth flow by redirecting to backend start endpoint    │
│  - Receives JWT token after successful OAuth callback               │
│  - Does NOT handle OAuth tokens directly (security)                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Express + TypeScript)                │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │                    OAuth Routes Layer                           │ │
│ │  /auth/oauth/:provider/start   - Initiates OAuth flow          │ │
│ │  /auth/oauth/:provider/callback - Handles provider callback    │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                    │                                 │
│                                    ▼                                 │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │                OAuth Service Layer                              │ │
│ │  - OAuthProviderFactory (creates provider instances)            │ │
│ │  - BaseOAuthProvider (abstract base class)                      │ │
│ │  - Provider-specific implementations                            │ │
│ │    • FacebookProvider                                           │ │
│ │    • InstagramProvider                                          │ │
│ │    • GoogleProvider                                             │ │
│ │    • MicrosoftProvider                                          │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                    │                                 │
│                                    ▼                                 │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │            User Service & Account Linking Layer                │ │
│ │  - findOrCreateUserFromOAuth()                                  │ │
│ │  - linkOAuthAccount()                                           │ │
│ │  - updateOAuthTokens()                                          │ │
│ │  - generateJWT()                                                │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                    │                                 │
│                                    ▼                                 │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │                  Database Layer (Prisma)                        │ │
│ │  Models:                                                        │ │
│ │  - User (existing, with optional password)                      │ │
│ │  - OAuthAccount (provider accounts linked to users)             │ │
│ │  - OAuthToken (encrypted tokens with refresh logic)             │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    OAuth Providers (External)                        │
│  - Facebook OAuth (accounts.facebook.com)                           │
│  - Instagram OAuth (api.instagram.com)                              │
│  - Google OpenID Connect (accounts.google.com)                      │
│  - Microsoft Entra ID (login.microsoftonline.com)                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Design Principles

### 1. Backend-Only OAuth Handling
- All OAuth token exchanges happen on the backend
- Frontend never sees access tokens, refresh tokens, or client secrets
- Frontend only receives final JWT token for API authentication

### 2. Unified Provider Interface
- All OAuth providers implement a common `IOAuthProvider` interface
- Factory pattern creates provider instances based on configuration
- Easy to add new providers without changing core logic

### 3. Account Linking
- Multiple OAuth providers can be linked to a single user account
- Users can authenticate with any linked provider
- Email is used as primary identifier when available
- Fallback to provider-specific ID for providers without email (Instagram)

### 4. Token Security
- OAuth tokens stored encrypted in database
- Short-lived access tokens
- Refresh tokens used to obtain new access tokens
- CSRF protection via state parameter
- PKCE (Proof Key for Code Exchange) for enhanced security

### 5. Schema Flexibility
- Provider-agnostic data model
- JSON fields for provider-specific metadata
- No schema changes needed for new providers

## Flow Diagrams

### OAuth Login Flow (Authorization Code Grant)

```
User          Frontend         Backend           OAuth Provider
 │                │                │                    │
 │  Click Login   │                │                    │
 ├───────────────>│                │                    │
 │                │  GET /auth/oauth/:provider/start    │
 │                ├───────────────>│                    │
 │                │                │                    │
 │                │                │ Generate state     │
 │                │                │ Generate PKCE      │
 │                │                │ Store in session   │
 │                │                │                    │
 │                │  302 Redirect  │                    │
 │                │<───────────────┤                    │
 │                │                │                    │
 │   Browser redirects to provider │                    │
 │────────────────────────────────────────────────────>│
 │                │                │                    │
 │   User authorizes app           │                    │
 │<────────────────────────────────────────────────────┤
 │                │                │                    │
 │   Provider redirects to callback with code          │
 │────────────────────────────────────────────────────>│
 │                │                │  code + state      │
 │                │                │<───────────────────┤
 │                │                │                    │
 │                │                │  Verify state      │
 │                │                │  Exchange code     │
 │                │                │  for tokens        │
 │                │                ├───────────────────>│
 │                │                │  Access + Refresh  │
 │                │                │<───────────────────┤
 │                │                │                    │
 │                │                │  Get user profile  │
 │                │                ├───────────────────>│
 │                │                │  User data         │
 │                │                │<───────────────────┤
 │                │                │                    │
 │                │                │  Find/Create User  │
 │                │                │  Store OAuth data  │
 │                │                │  Generate JWT      │
 │                │                │                    │
 │                │  Redirect to frontend with JWT     │
 │<───────────────────────────────┤                    │
 │                │                │                    │
 │  Store JWT & authenticate      │                    │
 │                │                │                    │
```

### Account Linking Flow

```
User               Backend              OAuth Provider
 │                    │                       │
 │  Already logged in │                       │
 │  Has JWT token     │                       │
 │                    │                       │
 │  GET /auth/oauth/:provider/start?link=true│
 ├───────────────────>│                       │
 │                    │  Verify JWT           │
 │                    │  Generate state       │
 │                    │  Store user ID        │
 │                    │                       │
 │  302 Redirect      │                       │
 │<───────────────────┤                       │
 │                                            │
 │  User authorizes                           │
 │───────────────────────────────────────────>│
 │                                            │
 │  Callback with code                        │
 │───────────────────────────────────────────>│
 │                    │  code + state         │
 │                    │<──────────────────────┤
 │                    │                       │
 │                    │  Exchange for tokens  │
 │                    │──────────────────────>│
 │                    │  Tokens               │
 │                    │<──────────────────────┤
 │                    │                       │
 │                    │  Get provider profile │
 │                    │──────────────────────>│
 │                    │  Profile data         │
 │                    │<──────────────────────┤
 │                    │                       │
 │                    │  Link OAuth account   │
 │                    │  to existing user     │
 │                    │                       │
 │  Success response  │                       │
 │<───────────────────┤                       │
```

## Security Features

### CSRF Protection
- Cryptographically random state parameter (32 bytes)
- Stored in server-side session
- Verified on callback
- Prevents authorization code injection attacks

### PKCE (Proof Key for Code Exchange)
- Code verifier: 128 random bytes, base64url encoded
- Code challenge: SHA-256 hash of verifier
- Protects against authorization code interception
- Recommended for all OAuth 2.0 flows

### Token Storage
- Access tokens encrypted at rest (AES-256-GCM)
- Refresh tokens encrypted separately
- Tokens never logged or exposed in API responses
- Automatic token rotation on refresh

### Environment Variable Security
- Client secrets in environment variables only
- Never committed to version control
- Different values per environment (dev/staging/prod)
- Render-compatible secret management

### Rate Limiting
- OAuth endpoints rate-limited per IP
- Prevents brute force attacks
- Configurable limits based on environment

## Error Handling

### Common OAuth Errors

| Error | HTTP Code | Cause | User Action |
|-------|-----------|-------|-------------|
| `invalid_state` | 400 | State mismatch (CSRF) | Retry login |
| `access_denied` | 403 | User denied authorization | Grant permissions |
| `invalid_code` | 400 | Code expired or already used | Retry login |
| `provider_error` | 502 | Provider API error | Try again later |
| `email_required` | 400 | Provider didn't return email | Use different method |
| `account_exists` | 409 | Email already registered | Link account instead |

### Error Response Format

```json
{
  "error": "invalid_state",
  "message": "Invalid OAuth state parameter",
  "timestamp": "2026-01-10T12:00:00Z",
  "provider": "google"
}
```

## Provider-Specific Considerations

### Facebook (Meta)
- **Scopes**: `email`, `public_profile`
- **Email**: Always provided
- **User ID**: Stable across app
- **Token Expiry**: 60 days (long-lived)
- **Refresh**: Exchange short-lived for long-lived token
- **Special Notes**: Requires App Review for production

### Instagram (Meta)
- **Scopes**: `user_profile`, `user_media`
- **Email**: NOT provided by Instagram Basic Display API
- **User ID**: Stable Instagram user ID
- **Token Expiry**: 60 days
- **Refresh**: Long-lived token refresh
- **Special Notes**: 
  - Must handle missing email
  - Requires Instagram account linking
  - Create account with username@instagram.local email pattern
  - User must provide real email later

### Google (OpenID Connect)
- **Scopes**: `openid`, `email`, `profile`
- **Email**: Always provided (verified)
- **User ID**: Stable Google ID (sub claim)
- **Token Expiry**: 1 hour
- **Refresh**: Standard refresh token flow
- **Special Notes**: 
  - Use ID token for user info
  - Email verification status available
  - Supports incremental authorization

### Microsoft (Entra ID)
- **Scopes**: `openid`, `email`, `profile`
- **Email**: Usually provided
- **User ID**: Object ID (oid claim)
- **Token Expiry**: 1 hour
- **Refresh**: Standard refresh token flow
- **Special Notes**:
  - Personal vs Work accounts
  - Tenant-specific or common endpoint
  - Azure AD B2C option for customization

## Database Schema Design

See [oauth-schema.md](./oauth-schema.md) for detailed Prisma models.

Key tables:
- **users**: Extended with optional password (for OAuth-only accounts)
- **oauth_accounts**: Provider account links
- **oauth_tokens**: Encrypted token storage
- **oauth_state**: Temporary state storage for CSRF protection

## API Endpoints

### Public Endpoints

#### Start OAuth Flow
```
GET /auth/oauth/:provider/start
Query Parameters:
  - link (optional): "true" to link to existing account
  - redirect (optional): Frontend URL to redirect after success
Response: 302 redirect to OAuth provider
```

#### OAuth Callback
```
GET /auth/oauth/:provider/callback
Query Parameters:
  - code: Authorization code from provider
  - state: CSRF protection state
Response: 302 redirect to frontend with JWT or error
```

### Protected Endpoints (Require JWT)

#### List Linked Accounts
```
GET /auth/oauth/accounts
Response: Array of linked OAuth providers
```

#### Unlink Account
```
DELETE /auth/oauth/accounts/:provider
Response: Success message
```

## Render.com Deployment Notes

### Environment Variables
```bash
# JWT (existing)
JWT_SECRET=your-jwt-secret

# Database (existing)
DATABASE_URL=postgresql://...

# Base URLs
API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Facebook OAuth
FACEBOOK_CLIENT_ID=your-fb-app-id
FACEBOOK_CLIENT_SECRET=your-fb-app-secret
FACEBOOK_CALLBACK_URL=https://api.yourdomain.com/auth/oauth/facebook/callback

# Instagram OAuth (uses same Meta app)
INSTAGRAM_CLIENT_ID=your-ig-app-id
INSTAGRAM_CLIENT_SECRET=your-ig-app-secret
INSTAGRAM_CALLBACK_URL=https://api.yourdomain.com/auth/oauth/instagram/callback

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/auth/oauth/google/callback

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=common
MICROSOFT_CALLBACK_URL=https://api.yourdomain.com/auth/oauth/microsoft/callback

# Encryption (for token storage)
ENCRYPTION_KEY=32-byte-hex-string-for-aes-256
```

### HTTPS Requirements
- All OAuth providers require HTTPS callbacks in production
- Render provides automatic HTTPS
- Use custom domain or Render subdomain
- Test locally with ngrok or similar

### Callback URL Configuration
- Must be registered in each provider's developer console
- Must match exactly (including protocol, domain, path)
- Render subdomain: `your-app.onrender.com`
- Custom domain: `api.yourdomain.com`

### Session Storage
- Use Redis for production session storage
- Render Redis addon available
- Fallback to memory store for development
- Configure in `express-session`

## Testing Strategy

### Local Development
1. Use provider sandbox/test apps
2. Configure localhost callbacks (http://localhost:5000)
3. Use ngrok for testing with production apps
4. Mock provider responses for unit tests

### Integration Testing
1. Test each provider independently
2. Test account linking scenarios
3. Test error conditions (denied access, expired codes)
4. Test token refresh logic
5. Test CSRF protection

### Security Testing
1. Verify state parameter validation
2. Test PKCE implementation
3. Verify token encryption
4. Test rate limiting
5. Test session fixation prevention

## Migration from Existing Auth

### Backward Compatibility
- Existing email/password users unaffected
- OAuth is additive, not replacement
- Users can link OAuth to existing accounts
- Password remains optional (nullable in schema)

### Migration Steps
1. Deploy schema changes (add OAuth tables)
2. Deploy OAuth code (feature flag disabled)
3. Enable OAuth for internal testing
4. Gradual rollout to users
5. Monitor error rates and usage

## Future Enhancements

### Potential Additions
- Twitter/X OAuth 2.0
- Apple Sign In
- GitHub OAuth
- LinkedIn OAuth
- Discord OAuth

### Advanced Features
- Social login for API access (service accounts)
- OAuth scope management
- Token revocation endpoint
- Admin OAuth connection dashboard
- OAuth audit logging

## Support and Troubleshooting

### Common Issues

**Issue**: "Redirect URI mismatch"
- **Cause**: Callback URL not registered with provider
- **Fix**: Add exact URL to provider console

**Issue**: "Invalid state parameter"
- **Cause**: Session expired or CSRF attack
- **Fix**: User retries login, check session config

**Issue**: "Email required but not provided"
- **Cause**: Instagram doesn't provide email
- **Fix**: Prompt user for email after OAuth

**Issue**: "Token refresh failed"
- **Cause**: Refresh token expired or revoked
- **Fix**: User must re-authenticate

### Monitoring
- Log OAuth errors with provider context
- Monitor token refresh success rates
- Track OAuth login vs password login usage
- Alert on high error rates per provider

## References

- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
