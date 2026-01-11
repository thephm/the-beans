# OAuth Database Schema

This document describes the Prisma schema extensions required for OAuth 2.0 authentication.

## Schema Changes Required

### 1. Make User Password Optional (for OAuth-only accounts)

```prisma
model User {
  id              String          @id @default(cuid())
  email           String          @unique
  username        String          @unique
  password        String?         // Changed from required to optional
  firstName       String
  lastName        String
  avatar          String?
  bio             String?
  location        String?
  latitude        Float?
  longitude       Float?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  language        String          @default("en") @db.VarChar(5)
  settings        Json?
  role            String          @default("user") @db.VarChar(16)
  isDeprecated    Boolean         @default(false)
  createdById     String?
  updatedById     String?
  lastLogin       DateTime?
  
  // OAuth relationships
  oauthAccounts   OAuthAccount[]
  
  // ... existing relationships
  auditLogs       AuditLog[]
  createdBeans    Bean[]          @relation("BeanCreatedBy")
  updatedBeans    Bean[]          @relation("BeanUpdatedBy")
  comments        Comment[]
  favourites       Favourite[]
  notifications   Notification[]
  createdReviews  Review[]        @relation("ReviewCreatedBy")
  updatedReviews  Review[]        @relation("ReviewUpdatedBy")
  reviews         Review[]
  uploadedImages  RoasterImage[]
  createdPeople   RoasterPerson[] @relation("PersonCreatedBy")
  updatedPeople   RoasterPerson[] @relation("PersonUpdatedBy")
  personRoles     RoasterPerson[] @relation("UserPersonRole")
  createdRoasters Roaster[]       @relation("RoasterCreatedBy")
  roasters        Roaster[]
  updatedRoasters Roaster[]       @relation("RoasterUpdatedBy")
  createdBy       User?           @relation("UserCreatedBy", fields: [createdById], references: [id])
  createdUsers    User[]          @relation("UserCreatedBy")
  updatedBy       User?           @relation("UserUpdatedBy", fields: [updatedById], references: [id])
  updatedUsers    User[]          @relation("UserUpdatedBy")
  passwordResetTokens PasswordResetToken[]

  @@map("users")
}
```

### 2. OAuth Account Model (Links Users to Providers)

```prisma
model OAuthAccount {
  id                String   @id @default(cuid())
  userId            String
  provider          String   // 'facebook', 'instagram', 'google', 'microsoft'
  providerAccountId String   // Unique ID from the OAuth provider
  
  // Provider-specific data
  email             String?  // May be null for Instagram
  displayName       String?
  profilePicture    String?
  metadata          Json?    // Provider-specific extra data
  
  // Access control
  scope             String[] // OAuth scopes granted
  
  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  lastUsedAt        DateTime @default(now()) // Track when user last authenticated
  
  // Relations
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokens            OAuthToken[]
  
  // Ensure one account per provider per user
  @@unique([userId, provider])
  // Ensure provider account ID is unique per provider
  @@unique([provider, providerAccountId])
  @@index([userId])
  @@index([provider])
  
  @@map("oauth_accounts")
}
```

### 3. OAuth Token Model (Encrypted Token Storage)

```prisma
model OAuthToken {
  id                  String   @id @default(cuid())
  oauthAccountId      String
  
  // Encrypted tokens (AES-256-GCM)
  accessToken         String   @db.Text // Encrypted
  refreshToken        String?  @db.Text // Encrypted, may be null
  
  // Token metadata
  tokenType           String   @default("Bearer")
  expiresAt           DateTime?
  scope               String[] // May differ from account scope
  
  // Refresh metadata
  lastRefreshedAt     DateTime?
  refreshFailCount    Int      @default(0) // Track failed refresh attempts
  
  // Timestamps
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // Relations
  oauthAccount        OAuthAccount @relation(fields: [oauthAccountId], references: [id], onDelete: Cascade)
  
  // Only one active token per OAuth account
  @@unique([oauthAccountId])
  @@index([expiresAt]) // For cleanup of expired tokens
  
  @@map("oauth_tokens")
}
```

### 4. OAuth State Model (CSRF Protection)

```prisma
model OAuthState {
  id              String   @id @default(cuid())
  state           String   @unique // Random CSRF token
  provider        String   // Which provider this is for
  
  // PKCE parameters
  codeVerifier    String   // For PKCE challenge
  codeChallenge   String   // Sent to provider
  
  // Link mode (optional)
  userId          String?  // If linking to existing account
  redirectUrl     String?  // Where to send user after completion
  
  // Metadata
  ipAddress       String?
  userAgent       String?
  
  // Expiry
  expiresAt       DateTime
  createdAt       DateTime @default(now())
  
  // Relations
  user            User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([state])
  @@index([expiresAt]) // For cleanup
  
  @@map("oauth_states")
}
```

## Migration Strategy

### Step 1: Create Migration File

```bash
npx prisma migrate dev --name add_oauth_support
```

### Step 2: Migration SQL (Generated)

The migration will:
1. Make `users.password` nullable
2. Create `oauth_accounts` table
3. Create `oauth_tokens` table
4. Create `oauth_states` table
5. Create indexes and foreign keys

### Step 3: Update Existing Code

After migration, update user creation code to handle nullable password:

```typescript
// Before (existing)
const hashedPassword = await bcrypt.hash(password, 12);
const user = await prisma.user.create({
  data: {
    email,
    username,
    password: hashedPassword,
    firstName,
    lastName,
  },
});

// After (OAuth-compatible)
const userData: any = {
  email,
  username,
  firstName,
  lastName,
};

// Only hash password if provided (traditional signup)
if (password) {
  userData.password = await bcrypt.hash(password, 12);
}

const user = await prisma.user.create({
  data: userData,
});
```

## Data Model Relationships

```
User (1) ─────< (N) OAuthAccount
                      │
                      │ (1)
                      │
                      v
                      │ (1)
                      │
                    OAuthToken

User (1) ─────< (N) OAuthState (temporary)
```

## Key Design Decisions

### 1. Encrypted Token Storage

**Why**: OAuth tokens are sensitive credentials that grant access to user data.

**Implementation**:
- Use Node.js `crypto` module with AES-256-GCM
- Store encryption key in environment variable
- Encrypt before storing, decrypt when needed
- Never log tokens

**Example**:
```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### 2. Separate Token Table

**Why**: Tokens have different lifecycle than accounts.

**Benefits**:
- Can delete/rotate tokens without affecting account
- Can track token refresh history
- Easier to implement token expiry cleanup
- Supports multiple tokens per account (future)

### 3. Temporary State Storage

**Why**: OAuth state must be verified but doesn't need permanent storage.

**Implementation**:
- State expires after 10 minutes
- Cleanup job removes expired states
- Includes PKCE parameters
- Supports account linking mode

### 4. Provider-Agnostic Design

**Why**: Easy to add new providers without schema changes.

**How**:
- `provider` is a string, not enum
- `metadata` JSON field for provider-specific data
- Standardized field names across providers
- Provider logic in service layer, not database

## Indexes and Performance

### Critical Indexes

1. **oauth_accounts**
   - `userId` - Fast user account lookup
   - `provider` - Provider-specific queries
   - `(userId, provider)` - Unique constraint + fast lookup
   - `(provider, providerAccountId)` - Prevent duplicate provider accounts

2. **oauth_tokens**
   - `oauthAccountId` - One token per account lookup
   - `expiresAt` - Cleanup job performance

3. **oauth_states**
   - `state` - Fast CSRF verification
   - `expiresAt` - Cleanup job performance

### Cleanup Jobs

Run periodic cleanup to remove:
- Expired OAuth states (older than 10 minutes)
- Orphaned tokens (account deleted)
- Tokens with too many refresh failures

```typescript
// Cleanup job (run every hour)
async function cleanupOAuthData() {
  const now = new Date();
  
  // Remove expired states
  await prisma.oAuthState.deleteMany({
    where: { expiresAt: { lt: now } }
  });
  
  // Remove tokens that failed to refresh multiple times
  await prisma.oAuthToken.deleteMany({
    where: { refreshFailCount: { gte: 5 } }
  });
}
```

## Data Validation Rules

### User Model
- Email: Must be unique, valid email format (or Instagram placeholder)
- Username: Must be unique, 3-50 characters
- Password: Optional, min 6 characters when provided

### OAuthAccount Model
- Provider: Must be one of supported providers
- ProviderAccountId: Required, unique per provider
- Email: Optional (Instagram case), valid email when provided
- Scope: Array of granted scopes

### OAuthToken Model
- AccessToken: Required, encrypted
- RefreshToken: Optional, encrypted when present
- ExpiresAt: Should be in future when token is valid

### OAuthState Model
- State: Required, 32+ random bytes
- CodeVerifier: Required, 128 random bytes
- ExpiresAt: Must be <= 10 minutes from creation

## Security Considerations

### 1. Cascade Deletes
- Deleting user deletes all OAuth accounts (Cascade)
- Deleting OAuth account deletes tokens (Cascade)
- Deleting user deletes OAuth states (Cascade)

### 2. Unique Constraints
- One OAuth account per provider per user
- Provider account ID unique per provider (prevents sharing)
- State parameter unique (prevents replay)

### 3. No Sensitive Data Logging
- Never log OAuth tokens
- Never expose tokens in API responses
- Encrypt at rest in database
- Decrypt only when needed for API calls

### 4. Token Rotation
- Refresh tokens should be rotated when used
- Track refresh failures
- Disable after too many failures

## Example Queries

### Find User by OAuth Provider

```typescript
const user = await prisma.user.findFirst({
  where: {
    oauthAccounts: {
      some: {
        provider: 'google',
        providerAccountId: googleUserId,
      },
    },
  },
  include: {
    oauthAccounts: true,
  },
});
```

### Get User's OAuth Accounts

```typescript
const accounts = await prisma.oAuthAccount.findMany({
  where: { userId: user.id },
  select: {
    provider: true,
    email: true,
    displayName: true,
    lastUsedAt: true,
    scope: true,
  },
});
```

### Get Fresh Access Token

```typescript
const token = await prisma.oAuthToken.findUnique({
  where: { oauthAccountId: account.id },
});

if (!token || (token.expiresAt && token.expiresAt < new Date())) {
  // Need to refresh
  const refreshed = await refreshOAuthToken(account);
  return refreshed.accessToken;
}

return decrypt(token.accessToken);
```

### Verify OAuth State

```typescript
const stateRecord = await prisma.oAuthState.findUnique({
  where: { state: callbackState },
});

if (!stateRecord || stateRecord.expiresAt < new Date()) {
  throw new Error('Invalid or expired state');
}

// Use and delete
await prisma.oAuthState.delete({
  where: { id: stateRecord.id },
});
```

## Testing Data

### Seed Data for Development

```typescript
// Create user with both password and OAuth
const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    username: 'testuser',
    password: await bcrypt.hash('password123', 12),
    firstName: 'Test',
    lastName: 'User',
    oauthAccounts: {
      create: [
        {
          provider: 'google',
          providerAccountId: 'google_123',
          email: 'test@example.com',
          displayName: 'Test User',
          scope: ['openid', 'email', 'profile'],
          tokens: {
            create: {
              accessToken: encrypt('fake_access_token'),
              refreshToken: encrypt('fake_refresh_token'),
              expiresAt: new Date(Date.now() + 3600000),
            },
          },
        },
      ],
    },
  },
});

// Create OAuth-only user (no password)
const oauthUser = await prisma.user.create({
  data: {
    email: 'oauth@example.com',
    username: 'oauthuser',
    password: null, // OAuth-only
    firstName: 'OAuth',
    lastName: 'User',
    oauthAccounts: {
      create: {
        provider: 'facebook',
        providerAccountId: 'fb_456',
        email: 'oauth@example.com',
        displayName: 'OAuth User',
        scope: ['email', 'public_profile'],
      },
    },
  },
});
```

## Complete Prisma Schema Addition

Add these models to `server/prisma/schema.prisma`:

```prisma
// Add to User model
model User {
  // ... existing fields ...
  password        String?         // Make nullable
  // ... existing fields ...
  oauthAccounts   OAuthAccount[]  // Add relation
  oauthStates     OAuthState[]    // Add relation
  // ... rest of existing fields ...
}

// New models
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
