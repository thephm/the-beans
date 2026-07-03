# Auth Feature

Authentication enables users to securely register, log in, and manage their accounts. The system supports both traditional email/password authentication and OAuth 2.0 social login with multiple providers.

## OAuth 2.0 Social Login

### 📚 Documentation
- [📐 Architecture](./oauth-architecture.md) - System design and flow diagrams
- [🗄️ Database Schema](./oauth-schema.md) - Prisma models and migrations
- [⚙️ Configuration](./oauth-configuration.md) - Provider setup guide
- [🔒 Security](./oauth-security.md) - Security best practices
- [🚀 Implementation](./oauth-implementation.md) - Current implementation notes
- [📚 Libraries](./oauth-libraries.md) - Library recommendations

### ✅ Supported Providers
- **Meta (Facebook)** - Full OAuth 2.0 with email
- **Instagram** - Basic Display API (handles missing email)
- **Google** - OpenID Connect with refresh tokens
- **Microsoft** - Entra ID for work and personal accounts

### 🔐 Security Features
- Backend-only OAuth (tokens never exposed to frontend)
- PKCE (Proof Key for Code Exchange)
- CSRF protection with state parameter
- AES-256-GCM token encryption at rest
- Multiple providers per user account
- Account linking support

### 🚀 Quick Start
1. Review existing OAuth models: [oauth-schema.md](./oauth-schema.md)
2. Configure provider credentials: [oauth-configuration.md](./oauth-configuration.md)
3. Review implementation notes: [oauth-implementation.md](./oauth-implementation.md)

## Traditional Authentication

The system uses JWT-based authentication, secure password hashing, and input validation to protect user data.

### Features
- Email/password registration and login
- JWT token-based authentication
- Password reset functionality
- Role-based access control
- Internationalized UI
- Comprehensive error handling

---

**See also:** [API](api.md) | [Design](design.md) | [Requirements](requirements.md) | [Test Cases](test.md)
