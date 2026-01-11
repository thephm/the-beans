# OAuth Security Best Practices

This document outlines security considerations and best practices for the OAuth 2.0 implementation in The Beans application.

## Table of Contents

1. [Token Security](#token-security)
2. [CSRF Protection](#csrf-protection)
3. [PKCE Implementation](#pkce-implementation)
4. [Secret Management](#secret-management)
5. [Transport Security](#transport-security)
6. [Rate Limiting](#rate-limiting)
7. [Session Security](#session-security)
8. [Data Privacy](#data-privacy)
9. [Audit Logging](#audit-logging)
10. [Incident Response](#incident-response)

---

## 1. Token Security

### Encryption at Rest

**Threat**: Database breach exposes OAuth tokens, allowing attackers to impersonate users.

**Mitigation**:
- All OAuth access tokens and refresh tokens are encrypted using AES-256-GCM
- Authenticated encryption prevents tampering
- Encryption key stored securely in environment variables
- Tokens never logged or exposed in API responses

**Implementation**:
```typescript
// Tokens encrypted before storage
accessToken: encrypt(tokenResponse.accessToken)

// Decrypted only when needed
const token = decrypt(storedToken.accessToken);
```

### Token Storage

**Best Practices**:
- Tokens stored in database with encryption
- Tokens associated with specific OAuth account
- Separate table for token data (easy rotation)
- Never store tokens in localStorage (frontend)
- Never include tokens in URLs
- Never log tokens in application logs

### Token Expiration

**Implementation**:
- Access tokens expire per provider policy (1-60 days)
- Refresh tokens used to obtain new access tokens
- Expired tokens automatically refreshed on use
- Failed refresh attempts tracked and limited

**Code Example**:
```typescript
// Check expiration before use
if (token.expiresAt && token.expiresAt < new Date()) {
  // Refresh token
  const refreshed = await refreshAccessToken(token.refreshToken);
  await updateTokens(refreshed);
}
```

### Token Revocation

**Scenarios**:
1. User unlinks OAuth account
2. Multiple failed refresh attempts
3. Suspicious activity detected
4. User requests account deletion

**Action**:
- Delete token from database
- Consider revoking with provider (some support revocation endpoint)
- Force user to re-authenticate

---

## 2. CSRF Protection

### State Parameter

**Threat**: Authorization code injection attack where attacker tricks victim into using attacker's OAuth account.

**Mitigation**:
- Generate cryptographically secure random state parameter (32 bytes)
- Store state in database with short expiration (10 minutes)
- Verify state on callback before processing authorization code
- One-time use only (deleted after verification)

**Implementation**:
```typescript
// Generate state
const state = crypto.randomBytes(32).toString('base64url');

// Store in database
await prisma.oAuthState.create({
  data: {
    state,
    provider,
    codeVerifier,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  },
});

// Verify on callback
const stateRecord = await prisma.oAuthState.findUnique({
  where: { state: callbackState },
});

if (!stateRecord || stateRecord.expiresAt < new Date()) {
  throw new Error('Invalid or expired state');
}
```

### State Storage

**Options**:
1. **Database** (current implementation)
   - Survives server restarts
   - Works with multiple server instances
   - Easy to implement expiration
   - Can store additional context (user ID, redirect URL)

2. ⚠️ **Server-side session**
   - Requires session management
   - Must use secure session store (Redis)
   - Session fixation risks

3. **Client-side storage**
   - Vulnerable to XSS
   - Not secure

### State Validation

**Checks**:
1. State parameter exists
2. State found in database
3. State not expired
4. Provider matches
5. IP address matches (optional, strict)
6. User agent matches (optional, strict)

---

## 3. PKCE Implementation

### Overview

**PKCE** (Proof Key for Code Exchange) protects against authorization code interception attacks.

**Flow**:
1. Generate code verifier (128 random bytes)
2. Create code challenge (SHA-256 hash of verifier)
3. Send challenge to authorization server
4. Exchange code + verifier for tokens
5. Server verifies: SHA-256(verifier) === challenge

### Implementation

```typescript
// Generate PKCE parameters
const codeVerifier = crypto.randomBytes(128).toString('base64url');
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

// Include in authorization URL
const authUrl = `${provider.authUrl}?...&code_challenge=${codeChallenge}&code_challenge_method=S256`;

// Include verifier in token exchange
const tokenRequest = {
  code,
  code_verifier: codeVerifier,
  // ... other params
};
```

### Security Benefits

1. **Authorization Code Interception**: Even if attacker steals code, can't exchange without verifier
2. **No Client Secret Needed**: Public clients (SPAs, mobile) don't need secrets
3. **Defense in Depth**: Additional layer even with confidential clients

### Provider Support

| Provider | PKCE Support | Required |
|----------|--------------|----------|
| Google | Yes | Recommended |
| Microsoft | Yes | Recommended |
| Facebook | Partial | Optional |
| Instagram | Partial | Optional |

---

## 4. Secret Management

### Environment Variables

**Best Practices**:
- All secrets in environment variables
- Different secrets per environment (dev/staging/prod)
- Never commit secrets to version control
- Use `.env` file for local development
- Use Render environment tab for production
- Never hardcode secrets in code
- Never log secrets

### Secret Rotation

**Schedule**:
- OAuth client secrets: Every 6-12 months
- Encryption key: Every 12 months
- JWT secret: Every 12 months

**Process**:
1. Generate new secret in provider console
2. Add new secret to environment (keep old one temporarily)
3. Deploy application with support for both secrets
4. Update environment to use new secret
5. Remove old secret after verification
6. Revoke old secret in provider console

### Encryption Key Management

**Generation**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Requirements**:
- Must be 32 bytes (64 hex characters)
- Must be cryptographically random
- Different key per environment
- Store securely (environment variables, secrets manager)

### Render Secrets Management

**Setup**:
1. Render Dashboard → Service → Environment
2. Add secret variables
3. Mark as "Secret" (masked in UI)
4. Use environment groups for shared secrets

**Production Checklist**:
- [ ] All secrets marked as "Secret" in Render
- [ ] No secrets in git repository
- [ ] `.env` in `.gitignore`
- [ ] Secrets documented in team password manager
- [ ] Rotation schedule established

---

## 5. Transport Security

### HTTPS Requirements

**Production**:
- All OAuth callbacks must use HTTPS
- API endpoints must use HTTPS
- Frontend must use HTTPS
- Never use HTTP in production

**Render Configuration**:
- Automatic HTTPS provided
- Free SSL certificates
- HTTP to HTTPS redirect enabled
- Custom domains supported

### Certificate Validation

**Best Practices**:
- Validate OAuth provider certificates
- Use up-to-date CA certificates
- Never disable certificate validation
- Never use self-signed certificates in production

### Token Transmission

**Rules**:
1. Tokens in Authorization header: `Authorization: Bearer <token>`
2. JWT tokens transmitted over HTTPS
3. Never include tokens in URL query parameters
4. Never include tokens in request body (unless OAuth token exchange)
5. Never include tokens in logs

---

## 6. Rate Limiting

### OAuth Endpoints

**Limits**:
```typescript
// Apply to OAuth routes
import rateLimit from 'express-rate-limit';

const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per IP
  message: 'Too many OAuth attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

router.use('/oauth', oauthLimiter);
```

**Rationale**:
- Prevent brute force attacks
- Prevent OAuth flow spam
- Protect against DDoS
- Limit impact of compromised credentials

### Token Refresh Limits

**Implementation**:
- Track failed refresh attempts in database
- After 5 failed attempts, require re-authentication
- Reset counter on successful refresh

```typescript
if (token.refreshFailCount >= 5) {
  // Too many failures, delete token
  await prisma.oAuthToken.delete({ where: { id: token.id } });
  throw new Error('Token refresh failed too many times, please re-authenticate');
}
```

### Provider Rate Limits

**Considerations**:
- Google: 10 requests/second per project
- Facebook: 200 calls/hour per user
- Microsoft: 2000 requests/second per app
- Instagram: 200 calls/hour per user

**Mitigation**:
- Cache user profiles when possible
- Batch API requests
- Implement exponential backoff
- Monitor usage in provider consoles

---

## 7. Session Security

### State Storage

**Current Implementation**: Database-backed state storage

**Benefits**:
- Survives server restarts
- Works with load balancers
- No session management needed
- Easy expiration handling

**Alternative**: Redis Sessions

If you implement session-based state storage:

```typescript
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true, // No JavaScript access
    maxAge: 10 * 60 * 1000, // 10 minutes
    sameSite: 'lax', // CSRF protection
  },
}));
```

### Cookie Security

If using cookies for any OAuth state:

**Settings**:
- `secure: true` - HTTPS only
- `httpOnly: true` - No JavaScript access
- `sameSite: 'lax'` - CSRF protection
- Short expiration (10 minutes)

---

## 8. Data Privacy

### PII Handling

**Data Collected**:
- Email address (if available)
- Display name
- Profile picture URL
- Provider user ID

**Best Practices**:
- Collect only necessary data
- Obtain user consent (OAuth consent screen)
- Allow users to view linked accounts
- Allow users to unlink accounts
- Delete OAuth data when user deletes account
- Never share user data without consent

### GDPR Compliance

**User Rights**:
1. **Right to Access**: `/api/auth/oauth/accounts` endpoint
2. **Right to Deletion**: Delete account deletes OAuth data (Cascade)
3. **Right to Portability**: Export user data on request
4. **Right to Rectification**: User can update profile

**Implementation**:
```prisma
// Cascade delete ensures OAuth data deleted with user
model OAuthAccount {
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Instagram Special Case

**Problem**: Instagram doesn't provide email

**Solution**:
1. Create placeholder email: `username@instagram.placeholder`
2. Prompt user to provide real email after signup
3. Send verification email to real address
4. Update email in database

**Implementation**:
```typescript
if (!profile.email) {
  // Placeholder email for Instagram
  email = `${profile.displayName}@instagram.placeholder`;
  
  // Set flag to prompt for real email
  user = await prisma.user.create({
    data: {
      email,
      emailVerified: false,
      // ... other fields
    },
  });
  
  // Frontend should check emailVerified and prompt
}
```

### Data Retention

**Policy**:
- OAuth tokens: Delete after 90 days of inactivity
- OAuth state records: Delete after 10 minutes
- Failed refresh tokens: Delete after 5 failures
- Deleted user data: Purge within 30 days

---

## 9. Audit Logging

### OAuth Events to Log

**Authentication Events**:
- OAuth flow started (provider, IP, user agent)
- OAuth callback received (provider, success/failure)
- New user created via OAuth
- OAuth account linked to existing user
- OAuth login successful
- OAuth login failed (with reason)

**Account Management Events**:
- OAuth account unlinked
- Token refresh successful
- Token refresh failed
- OAuth account deleted

### Log Format

```typescript
interface OAuthAuditLog {
  timestamp: Date;
  event: 'oauth_login' | 'oauth_signup' | 'oauth_link' | 'oauth_unlink';
  provider: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorCode?: string;
  metadata?: Record<string, any>;
}
```

### Implementation

```typescript
// Log OAuth events
await createAuditLog({
  entityType: 'user',
  entityId: user.id,
  action: 'OAUTH_LOGIN',
  actor: user.id,
  metadata: {
    provider: 'google',
    isNewUser: false,
  },
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
});
```

### Security Monitoring

**Alerts**:
- Multiple failed OAuth attempts from same IP
- OAuth login from new location/device
- Unusual provider usage patterns
- Token refresh failures spike
- CSRF state parameter failures

---

## 10. Incident Response

### Security Incident Types

1. **Token Compromise**: OAuth tokens leaked or stolen
2. **Client Secret Leak**: Client secret committed to git or exposed
3. **Database Breach**: Encrypted tokens accessed
4. **CSRF Attack**: State parameter manipulation
5. **Account Takeover**: Unauthorized OAuth account linking

### Response Procedures

#### Token Compromise

**Actions**:
1. Identify affected users
2. Delete all OAuth tokens for affected accounts
3. Force re-authentication
4. Notify affected users
5. Review audit logs for suspicious activity
6. Update security measures

**Code**:
```typescript
// Force token refresh for all users
await prisma.oAuthToken.deleteMany({
  where: {
    oauthAccount: {
      provider: 'google', // Affected provider
    },
  },
});
```

#### Client Secret Leak

**Actions**:
1. **Immediately** regenerate secret in provider console
2. Update environment variable with new secret
3. Deploy update to production
4. Revoke old secret in provider console
5. Review git history and remove secret from commits
6. Notify security team
7. Consider rotating encryption key

#### Database Breach

**Actions**:
1. Tokens are encrypted, but assume compromise
2. Rotate encryption key
3. Delete all OAuth tokens
4. Force all users to re-authenticate
5. Reset all client secrets
6. Update all secrets in production
7. Notify users of breach
8. Review database access logs

### Prevention Checklist

- [ ] Secrets never committed to version control
- [ ] `.env` in `.gitignore`
- [ ] Pre-commit hooks check for secrets
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning
- [ ] Rate limiting enabled
- [ ] Audit logging enabled
- [ ] Monitoring and alerting configured
- [ ] Incident response plan documented
- [ ] Team trained on security procedures

---

## Security Testing

### Automated Tests

```typescript
describe('OAuth Security', () => {
  it('should reject invalid state parameter', async () => {
    const response = await request(app)
      .get('/api/auth/oauth/google/callback')
      .query({ code: 'valid-code', state: 'invalid-state' });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('invalid_state');
  });
  
  it('should reject expired state', async () => {
    // Create expired state
    const expiredState = await prisma.oAuthState.create({
      data: {
        state: 'expired',
        expiresAt: new Date(Date.now() - 1000), // Past
        // ...
      },
    });
    
    const response = await request(app)
      .get('/api/auth/oauth/google/callback')
      .query({ code: 'valid-code', state: 'expired' });
    
    expect(response.status).toBe(400);
  });
  
  it('should encrypt tokens', async () => {
    const token = await prisma.oAuthToken.findFirst();
    
    // Token should not be readable
    expect(token?.accessToken).not.toMatch(/^[A-Za-z0-9_-]+$/);
    
    // Should have encryption format (iv:authTag:encrypted)
    expect(token?.accessToken.split(':')).toHaveLength(3);
  });
});
```

### Manual Testing

**Test Cases**:
1. OAuth flow completes successfully
2. Invalid state rejected
3. Expired state rejected
4. State reuse prevented (one-time use)
5. PKCE verifier validated
6. Tokens encrypted in database
7. Rate limiting works
8. Account linking works
9. Account unlinking prevents last auth method
10. Token refresh works

### Penetration Testing

**Scenarios**:
1. Authorization code interception
2. CSRF attack simulation
3. Token replay attack
4. SQL injection in OAuth endpoints
5. XSS in OAuth callback
6. Session fixation
7. Brute force OAuth flow

---

## Compliance

### OWASP Top 10 Mitigation

1. **A01:2021 – Broken Access Control**
   - JWT-based authentication
   - User-specific data access checks
   - Cascade deletes prevent orphaned data

2. **A02:2021 – Cryptographic Failures**
   - AES-256-GCM encryption for tokens
   - HTTPS enforced
   - Secure random generation

3. **A03:2021 – Injection**
   - Prisma ORM prevents SQL injection
   - Input validation on all endpoints
   - Parameterized queries

4. **A05:2021 – Security Misconfiguration**
   - Secrets in environment variables
   - Production vs development configs
   - Error messages don't leak info

5. **A07:2021 – Identification and Authentication Failures**
   - OAuth 2.0 standard implementation
   - PKCE for authorization code protection
   - CSRF protection with state parameter

### OAuth 2.0 Security Best Practices (RFC 8252)

- Authorization Code Flow (not Implicit)
- PKCE for all clients
- HTTPS for all endpoints
- State parameter for CSRF
- Short-lived access tokens
- Refresh token rotation
- Secure token storage

---

## Additional Resources

- [OWASP OAuth 2.0 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Security_Cheat_Sheet.html)
- [OAuth 2.0 Threat Model (RFC 6819)](https://tools.ietf.org/html/rfc6819)
- [OAuth 2.0 for Native Apps (RFC 8252)](https://tools.ietf.org/html/rfc8252)
- [OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
