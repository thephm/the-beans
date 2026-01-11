# OAuth 2.0 Implementation Guide

## Quick Start

This guide will walk you through implementing OAuth 2.0 authentication in The Beans application.

## Prerequisites

- Node.js and npm installed
- PostgreSQL database running
- Docker (for development environment)
- Provider developer accounts (Facebook, Google, Microsoft)

## Implementation Steps

### 1. Update Database Schema

Add OAuth models to your Prisma schema:

```bash
cd server
```

Edit `prisma/schema.prisma` and add the following to the `User` model:

```prisma
model User {
  // ... existing fields ...
  password        String?         // Make nullable for OAuth-only users
  oauthAccounts   OAuthAccount[]  // Add relation
  oauthStates     OAuthState[]    // Add relation
  // ... rest of existing fields ...
}
```

Then add the new models at the end of the file:

```prisma
model OAuthAccount {
  id                String   @id @default(cuid())
  userId            String
  provider          String
  providerAccountId String
  email             String?
  displayName       String?
  profilePicture    String?
  metadata          Json?
  scope             String[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  lastUsedAt        DateTime @default(now())
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokens            OAuthToken[]
  
  @@unique([userId, provider])
  @@unique([provider, providerAccountId])
  @@index([userId])
  @@index([provider])
  @@map("oauth_accounts")
}

model OAuthToken {
  id                  String   @id @default(cuid())
  oauthAccountId      String
  accessToken         String   @db.Text
  refreshToken        String?  @db.Text
  tokenType           String   @default("Bearer")
  expiresAt           DateTime?
  scope               String[]
  lastRefreshedAt     DateTime?
  refreshFailCount    Int      @default(0)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  oauthAccount        OAuthAccount @relation(fields: [oauthAccountId], references: [id], onDelete: Cascade)
  
  @@unique([oauthAccountId])
  @@index([expiresAt])
  @@map("oauth_tokens")
}

model OAuthState {
  id              String   @id @default(cuid())
  state           String   @unique
  provider        String
  codeVerifier    String
  codeChallenge   String
  userId          String?
  redirectUrl     String?
  ipAddress       String?
  userAgent       String?
  expiresAt       DateTime
  createdAt       DateTime @default(now())
  user            User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([state])
  @@index([expiresAt])
  @@map("oauth_states")
}
```

Run migration:

```bash
npx prisma migrate dev --name add_oauth_support
npx prisma generate
```

### 2. Install Dependencies

All required dependencies (axios, express, jsonwebtoken, etc.) are already installed in your project.

### 3. Add Environment Variables

Create or update `.env` in the `server/` directory:

```bash
# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to `.env`:

```bash
# OAuth Configuration
ENCRYPTION_KEY=<paste-64-character-key-here>
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:5000

# Facebook
FACEBOOK_CLIENT_ID=your-app-id
FACEBOOK_CLIENT_SECRET=your-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/oauth/facebook/callback

# Instagram
INSTAGRAM_CLIENT_ID=your-app-id
INSTAGRAM_CLIENT_SECRET=your-app-secret
INSTAGRAM_CALLBACK_URL=http://localhost:5000/api/auth/oauth/instagram/callback

# Google
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/oauth/google/callback

# Microsoft
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=common
MICROSOFT_CALLBACK_URL=http://localhost:5000/api/auth/oauth/microsoft/callback
```

See [oauth-configuration.md](./oauth-configuration.md) for detailed provider setup instructions.

### 4. Register OAuth Routes

Update `server/src/index.ts` to register the OAuth routes:

```typescript
import oauthRoutes from './routes/oauthNew';

// ... existing code ...

// Register OAuth routes
app.use('/api/auth/oauth', oauthRoutes);
```

### 5. Restart Backend

```bash
# Stop and restart Docker containers
docker-compose restart server
```

### 6. Test OAuth Flow

Visit in your browser:

```
http://localhost:5000/api/auth/oauth/google/start
```

You should be redirected to Google's login page. After authentication, you'll be redirected back to your frontend with a JWT token.

## Frontend Integration

### 1. Add OAuth Buttons

```typescript
// components/LoginForm.tsx
export function LoginForm() {
  const handleOAuthLogin = (provider: 'facebook' | 'instagram' | 'google' | 'microsoft') => {
    // Redirect to OAuth start endpoint
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/oauth/${provider}/start`;
  };

  return (
    <div>
      <button onClick={() => handleOAuthLogin('google')}>
        Sign in with Google
      </button>
      <button onClick={() => handleOAuthLogin('facebook')}>
        Sign in with Facebook
      </button>
      <button onClick={() => handleOAuthLogin('microsoft')}>
        Sign in with Microsoft
      </button>
      <button onClick={() => handleOAuthLogin('instagram')}>
        Sign in with Instagram
      </button>
    </div>
  );
}
```

### 2. Handle OAuth Callback

Create a callback page to receive the JWT token:

```typescript
// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const provider = searchParams.get('provider');
    const isNewUser = searchParams.get('isNewUser') === 'true';

    if (error) {
      // Handle error
      console.error('OAuth error:', error);
      router.push('/login?error=' + error);
      return;
    }

    if (token) {
      // Store token
      localStorage.setItem('authToken', token);
      
      // Redirect to home or profile
      if (isNewUser) {
        router.push('/profile/setup'); // First-time user setup
      } else {
        router.push('/');
      }
    }
  }, [searchParams, router]);

  return <div>Completing authentication...</div>;
}
```

### 3. Link OAuth Accounts (Optional)

For logged-in users to link additional OAuth providers:

```typescript
// components/AccountSettings.tsx
export function AccountSettings() {
  const { token } = useAuth(); // Your auth context

  const handleLinkAccount = (provider: string) => {
    // Include token for account linking
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/oauth/${provider}/start?link=true`;
    window.location.href = url;
  };

  return (
    <div>
      <h3>Linked Accounts</h3>
      <button onClick={() => handleLinkAccount('google')}>
        Link Google Account
      </button>
      {/* ... other providers */}
    </div>
  );
}
```

## Testing

### Test OAuth Configuration

Create `server/test-oauth.ts`:

```typescript
import dotenv from 'dotenv';
import { OAuthProviderFactory } from './src/lib/oauth/providers';
import './src/lib/oauth/providers'; // Register providers

dotenv.config();

async function testOAuthConfig() {
  const providers = ['facebook', 'instagram', 'google', 'microsoft'];

  console.log('Testing OAuth Configuration...\n');

  for (const name of providers) {
    try {
      const provider = OAuthProviderFactory.create(name);
      provider.validateConfig();
      console.log(`✅ ${name.padEnd(12)} Configuration valid`);
    } catch (error: any) {
      console.error(`❌ ${name.padEnd(12)} ${error.message}`);
    }
  }
}

testOAuthConfig();
```

Run:
```bash
ts-node test-oauth.ts
```

### Test Encryption

Create `server/test-encryption.ts`:

```typescript
import dotenv from 'dotenv';
import { encrypt, decrypt, generateEncryptionKey } from './src/lib/encryption';

dotenv.config();

const testData = 'test-oauth-token-12345';

console.log('Testing encryption...');
console.log('Original:', testData);

const encrypted = encrypt(testData);
console.log('Encrypted:', encrypted);

const decrypted = decrypt(encrypted);
console.log('Decrypted:', decrypted);

if (testData === decrypted) {
  console.log('✅ Encryption/decryption working correctly');
} else {
  console.error('❌ Encryption/decryption failed');
}
```

Run:
```bash
ts-node test-encryption.ts
```

## Troubleshooting

### Common Issues

**Issue**: "ENCRYPTION_KEY environment variable not set"

**Solution**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output to .env
```

**Issue**: "Provider 'google' not found"

**Solution**: Ensure providers are registered in `oauthNew.ts`:
```typescript
import '../lib/oauth/providers'; // This registers all providers
```

**Issue**: "redirect_uri_mismatch"

**Solution**: 
1. Check callback URL in `.env` matches exactly what's registered in provider console
2. Include protocol (http/https), domain, port, and full path
3. No trailing slashes unless registered with trailing slash

**Issue**: Database connection error

**Solution**:
```bash
# Ensure database is running
docker-compose up -d database

# Run migrations
docker-compose exec server npx prisma migrate dev
```

## Production Deployment (Render.com)

### 1. Update Environment Variables

In Render dashboard:
- Set all OAuth variables with production URLs
- Use `https://` for all callback URLs
- Use Render service URL: `https://your-app.onrender.com`

### 2. Update Provider Callback URLs

For each provider, add production callback URL:
- Facebook: Developer Console → Facebook Login → Valid OAuth Redirect URIs
- Google: Cloud Console → Credentials → Authorized redirect URIs
- Microsoft: Azure Portal → App Registration → Authentication → Redirect URIs

### 3. Deploy

```bash
git add .
git commit -m "Add OAuth authentication"
git push origin main
```

Render will automatically deploy.

### 4. Test Production

Visit:
```
https://your-app.onrender.com/api/auth/oauth/google/start
```

## Monitoring

### Track OAuth Usage

```typescript
// server/src/routes/analytics.ts
router.get('/oauth-stats', requireAuth, async (req, res) => {
  const stats = await prisma.oAuthAccount.groupBy({
    by: ['provider'],
    _count: true,
  });
  
  res.json({ stats });
});
```

### Monitor Failed Authentications

Check audit logs for OAuth errors:

```typescript
// Query audit logs
const failedOAuth = await prisma.auditLog.findMany({
  where: {
    action: 'OAUTH_LOGIN',
    metadata: {
      path: ['success'],
      equals: false,
    },
  },
  orderBy: { createdAt: 'desc' },
  take: 100,
});
```

## Next Steps

1. Implement OAuth (this guide)
2. Add social login buttons to UI
3. Implement account linking flow
4. Email verification for Instagram users (no email provided)
5. Customize OAuth consent screen in provider consoles
6. Set up monitoring and analytics
7. Regular security audits
8. Submit apps for provider review (production)

## File Structure

```
server/
├── src/
│   ├── lib/
│   │   ├── encryption.ts              # AES-256 encryption utilities
│   │   └── oauth/
│   │       ├── types.ts               # OAuth interfaces
│   │       ├── BaseOAuthProvider.ts   # Base provider class
│   │       ├── oauthService.ts        # User/token management
│   │       └── providers/
│   │           ├── index.ts           # Provider registry
│   │           ├── FacebookProvider.ts
│   │           ├── InstagramProvider.ts
│   │           ├── GoogleProvider.ts
│   │           └── MicrosoftProvider.ts
│   └── routes/
│       └── oauthNew.ts                # OAuth endpoints
├── prisma/
│   └── schema.prisma                  # Database schema (updated)
└── .env                               # Environment variables

docs/
└── auth/
    ├── oauth-architecture.md          # Architecture overview
    ├── oauth-schema.md                # Database schema details
    ├── oauth-configuration.md         # Provider setup guide
    ├── oauth-security.md              # Security best practices
    └── oauth-implementation.md        # This file
```

## Additional Resources

- [OAuth Architecture](./oauth-architecture.md) - System design and flow diagrams
- [Database Schema](./oauth-schema.md) - Prisma models and migrations
- [Provider Configuration](./oauth-configuration.md) - Step-by-step provider setup
- [Security Guide](./oauth-security.md) - Security best practices

## Support

For issues or questions:
1. Check [oauth-configuration.md](./oauth-configuration.md) troubleshooting section
2. Review [oauth-security.md](./oauth-security.md) for security concerns
3. Check provider documentation
4. Review audit logs for specific errors
