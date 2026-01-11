# OAuth Environment Configuration Guide

This guide provides detailed instructions for configuring OAuth 2.0 authentication with multiple providers.

## Required Environment Variables

Create a `.env` file in your server directory with the following variables:

```bash
# =============================================================================
# EXISTING CONFIGURATION (Keep these)
# =============================================================================

# JWT Secret (existing)
JWT_SECRET=your-existing-jwt-secret

# Database (existing)
DATABASE_URL=postgresql://beans_user:password@database:5432/the_beans_db

# =============================================================================
# NEW: OAUTH CONFIGURATION
# =============================================================================

# Base URLs
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Encryption Key for OAuth tokens (32 bytes = 64 hex characters)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your-64-character-hex-string-here

# =============================================================================
# FACEBOOK OAUTH
# =============================================================================

FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/oauth/facebook/callback

# =============================================================================
# INSTAGRAM OAUTH (uses Facebook/Meta developer platform)
# =============================================================================

INSTAGRAM_CLIENT_ID=your-instagram-app-id
INSTAGRAM_CLIENT_SECRET=your-instagram-app-secret
INSTAGRAM_CALLBACK_URL=http://localhost:5000/api/auth/oauth/instagram/callback

# =============================================================================
# GOOGLE OAUTH
# =============================================================================

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/oauth/google/callback

# =============================================================================
# MICROSOFT OAUTH
# =============================================================================

MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=common
MICROSOFT_CALLBACK_URL=http://localhost:5000/api/auth/oauth/microsoft/callback
```

## Provider Setup Instructions

### 1. Generate Encryption Key

Before setting up any providers, generate a secure encryption key for storing OAuth tokens:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and set it as `ENCRYPTION_KEY` in your `.env` file.

---

### 2. Facebook OAuth Setup

#### Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Consumer" as app type
4. Fill in app details:
   - **App Name**: The Beans
   - **Contact Email**: your@email.com
   - **App Purpose**: Login/Authentication

#### Step 2: Configure Facebook Login

1. In your app dashboard, add "Facebook Login" product
2. Go to "Facebook Login" → "Settings"
3. Add **Valid OAuth Redirect URIs**:
   - Development: `http://localhost:5000/api/auth/oauth/facebook/callback`
   - Production: `https://api.yourdomain.com/api/auth/oauth/facebook/callback`
4. Save changes

#### Step 3: Get Credentials

1. Go to "Settings" → "Basic"
2. Copy **App ID** → Set as `FACEBOOK_CLIENT_ID`
3. Click "Show" on **App Secret** → Set as `FACEBOOK_CLIENT_SECRET`

#### Step 4: Test Mode

- For development, your app is in "Development" mode
- Only you and added test users can authenticate
- To go live, submit for App Review (required for public use)

#### Required Permissions
- `email` (default)
- `public_profile` (default)

---

### 3. Instagram OAuth Setup

#### Step 1: Create Instagram App

Instagram OAuth uses the same Facebook/Meta developer platform:

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Use your existing app or create a new one
3. Add "Instagram Basic Display" product
4. Click "Create New App" under Instagram Basic Display

#### Step 2: Configure Instagram App

1. In Instagram Basic Display settings:
   - **Valid OAuth Redirect URIs**:
     - Development: `http://localhost:5000/api/auth/oauth/instagram/callback`
     - Production: `https://api.yourdomain.com/api/auth/oauth/instagram/callback`
   - **Deauthorize Callback URL**: `https://yourdomain.com/instagram/deauthorize`
   - **Data Deletion Request URL**: `https://yourdomain.com/instagram/delete`
2. Save changes

#### Step 3: Get Credentials

1. Copy **Instagram App ID** → Set as `INSTAGRAM_CLIENT_ID`
2. Copy **Instagram App Secret** → Set as `INSTAGRAM_CLIENT_SECRET`

#### Step 4: Add Test Users

1. Go to "Roles" → "Instagram Testers"
2. Add Instagram accounts for testing
3. Test users must accept invitation in their Instagram app

#### Important Notes
- Instagram does NOT provide email addresses
- App creates placeholder email: `username@instagram.placeholder`
- User must update email after first login
- Limited to 500 users without App Review

---

### 4. Google OAuth Setup

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing one
3. **Note**: You don't need to enable any APIs for basic OAuth 2.0

#### Step 2: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type (or "Internal" for Google Workspace)
3. Fill in app information:
   - **App name**: The Beans
   - **User support email**: your@email.com
   - **Developer contact**: your@email.com
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Add test users (if in testing mode)
6. Submit for verification (for production)

#### Step 3: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Fill in:
   - **Name**: The Beans Web Client
   - **Authorized redirect URIs**:
     - Development: `http://localhost:5000/api/auth/oauth/google/callback`
     - Production: `https://api.yourdomain.com/api/auth/oauth/google/callback`
5. Click "Create"

#### Step 4: Get Credentials

1. Copy **Client ID** → Set as `GOOGLE_CLIENT_ID`
2. Copy **Client Secret** → Set as `GOOGLE_CLIENT_SECRET`

#### Verification Status
- Unverified apps limited to 100 users
- Display warning to users during login
- Submit for verification for public use

---

### 5. Microsoft OAuth Setup

#### Step 1: Register Application

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Microsoft Entra ID" (formerly Azure AD)
3. Click "App registrations" → "New registration"
4. Fill in:
   - **Name**: The Beans
   - **Supported account types**: 
     - "Accounts in any organizational directory and personal Microsoft accounts" (recommended)
   - **Redirect URI**:
     - Platform: Web
     - URI: `http://localhost:5000/api/auth/oauth/microsoft/callback`
5. Click "Register"

#### Step 2: Add Redirect URIs

1. Go to "Authentication"
2. Add redirect URIs:
   - Development: `http://localhost:5000/api/auth/oauth/microsoft/callback`
   - Production: `https://api.yourdomain.com/api/auth/oauth/microsoft/callback`
3. Under "Implicit grant and hybrid flows", ensure tokens are NOT enabled (we use authorization code flow)
4. Save

#### Step 3: Configure API Permissions

1. Go to "API permissions"
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Select "Delegated permissions"
5. Add:
   - `openid`
   - `email`
   - `profile`
   - `User.Read`
6. Click "Add permissions"
7. (Optional) Click "Grant admin consent" if you have admin rights

#### Step 4: Create Client Secret

1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Add description: "The Beans OAuth Secret"
4. Set expiration (6 months, 12 months, or 24 months)
5. Click "Add"
6. **Copy the secret value immediately** (you can't see it again!)

#### Step 5: Get Credentials

1. Go to "Overview"
2. Copy **Application (client) ID** → Set as `MICROSOFT_CLIENT_ID`
3. Copy **Directory (tenant) ID** → Set as `MICROSOFT_TENANT_ID` (or use "common")
4. Use the client secret from Step 4 → Set as `MICROSOFT_CLIENT_SECRET`

#### Tenant Configuration
- `common`: Personal and work/school accounts (recommended)
- `organizations`: Work/school accounts only
- `consumers`: Personal Microsoft accounts only
- `{tenant-id}`: Specific tenant only

---

## Render.com Production Setup

### Step 1: Environment Variables

In your Render.com dashboard:

1. Go to your web service
2. Click "Environment"
3. Add all variables from `.env` above
4. **Important**: Update URLs to production values:
   ```bash
   API_URL=https://your-app.onrender.com
   FRONTEND_URL=https://yourdomain.com
   
   FACEBOOK_CALLBACK_URL=https://your-app.onrender.com/api/auth/oauth/facebook/callback
   INSTAGRAM_CALLBACK_URL=https://your-app.onrender.com/api/auth/oauth/instagram/callback
   GOOGLE_CALLBACK_URL=https://your-app.onrender.com/api/auth/oauth/google/callback
   MICROSOFT_CALLBACK_URL=https://your-app.onrender.com/api/auth/oauth/microsoft/callback
   ```

### Step 2: Update Provider Configurations

For each provider, update the callback URLs to use your production domain:

- **Facebook**: Developer Console → Facebook Login → Settings → Valid OAuth Redirect URIs
- **Instagram**: Developer Console → Instagram Basic Display → Valid OAuth Redirect URIs
- **Google**: Cloud Console → Credentials → Edit OAuth Client → Authorized redirect URIs
- **Microsoft**: Azure Portal → App Registration → Authentication → Redirect URIs

### Step 3: SSL/HTTPS

- Render automatically provides HTTPS
- All OAuth providers require HTTPS callbacks in production
- Do NOT use HTTP in production callback URLs

---

## Testing Your Configuration

### Test 1: Check Environment Variables

```bash
# In your server directory
node -e "
require('dotenv').config();
console.log('FACEBOOK_CLIENT_ID:', process.env.FACEBOOK_CLIENT_ID ? '✓ Set' : '✗ Missing');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ Missing');
console.log('MICROSOFT_CLIENT_ID:', process.env.MICROSOFT_CLIENT_ID ? '✓ Set' : '✗ Missing');
console.log('ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY?.length === 64 ? '✓ Valid (64 chars)' : '✗ Invalid');
"
```

### Test 2: Provider Validation

Create a test script `test-oauth-config.ts`:

```typescript
import '../lib/oauth/providers'; // Register providers
import { OAuthProviderFactory } from '../lib/oauth/providers';

const providers = ['facebook', 'instagram', 'google', 'microsoft'];

for (const name of providers) {
  try {
    const provider = OAuthProviderFactory.create(name);
    provider.validateConfig();
    console.log(`✓ ${name}: Configuration valid`);
  } catch (error: any) {
    console.error(`✗ ${name}: ${error.message}`);
  }
}
```

Run with:
```bash
ts-node test-oauth-config.ts
```

### Test 3: Start OAuth Flow

1. Start your server: `npm run dev`
2. Visit: `http://localhost:5000/api/auth/oauth/google/start`
3. Should redirect to Google login page
4. After authentication, should redirect to frontend with JWT

---

## Security Checklist

- [ ] `ENCRYPTION_KEY` is 64 hex characters (32 bytes)
- [ ] `JWT_SECRET` is strong and unique
- [ ] All client secrets are kept secret (never committed to git)
- [ ] Production callback URLs use HTTPS
- [ ] Callback URLs match exactly in provider consoles
- [ ] `.env` file is in `.gitignore`
- [ ] Different secrets for development and production
- [ ] Regular rotation of client secrets (every 6-12 months)

---

## Troubleshooting

### "redirect_uri_mismatch" Error

**Cause**: Callback URL doesn't match registered URL in provider console.

**Fix**:
1. Check exact URL in your `.env` file
2. Check registered URLs in provider console
3. Ensure protocol (http/https), domain, and path match exactly
4. No trailing slashes unless registered with trailing slash

### "invalid_client" Error

**Cause**: Client ID or secret is incorrect.

**Fix**:
1. Double-check credentials in provider console
2. Ensure no extra spaces in `.env` file
3. Regenerate client secret if needed
4. Verify app is not disabled in provider console

### "access_denied" Error

**Cause**: User denied permission or app lacks required scopes.

**Fix**:
1. Check scopes in provider configuration
2. For Google, ensure consent screen is configured
3. For Microsoft, ensure API permissions are added
4. For Facebook, ensure app is in development mode with test users

### "state mismatch" Error

**Cause**: CSRF state parameter doesn't match.

**Fix**:
1. Check database connectivity (state stored in DB)
2. Ensure cookies are enabled
3. Check that state record hasn't expired (10 min limit)
4. Verify clock synchronization on server

### Tokens Not Refreshing

**Cause**: Refresh token invalid or expired.

**Fix**:
1. Check provider console for token revocation
2. Verify refresh token stored correctly (encrypted)
3. For Google, ensure `access_type=offline` is set
4. User may need to re-authenticate

---

## Additional Resources

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
