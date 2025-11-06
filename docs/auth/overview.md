```markdown

# Authentication Overview

## Purpose

The Beans implements a secure, JWT-based authentication system that enables user account management, personalized features, and role-based access control (user vs admin roles).

## Key Concepts

### User Accounts
- Users register with email, username, and password
- Passwords are securely hashed using bcrypt (12 rounds)
- Each user has a unique email and username
- Users can optionally provide first name and last name

### JSON Web Tokens (JWT)
- Tokens are issued on successful registration or login
- Tokens expire after 7 days
- Tokens are signed with a server-side secret
- Frontend stores tokens in localStorage

### Role-Based Access
- **User Role**: Default for all new registrations
- **Admin Role**: Special privileges for system management
- Roles control access to admin-only routes and features

## Authentication Flow

### Registration Flow
1. User submits registration form (email, username, password, optional name)
2. Backend validates input and checks for existing users
3. Password is hashed with bcrypt
4. User record is created in database
5. JWT token is generated and returned
6. Frontend stores token and user data
7. Audit log records user creation

### Login Flow
1. User submits email and password
2. Backend validates credentials against database
3. `lastLogin` timestamp is updated
4. JWT token is generated and returned
5. Frontend stores token and user data
6. User is redirected to discover page

### Authenticated Requests
1. Frontend attaches JWT token to API requests (Authorization: Bearer <token>)
2. Backend middleware verifies token signature
3. User ID is extracted from token
4. Request proceeds with authenticated user context

### Logout
1. Frontend removes token from localStorage
2. User data is cleared from React state
3. User is redirected to home page
4. Backend maintains no session state (stateless JWT)

## Protected Routes

### Frontend Protection
- React Context manages authentication state
- `AuthContext` provides `isAuthenticated` boolean
- Protected pages check authentication status
- Unauthenticated users are redirected to login

### Backend Protection
- `optionalAuth` middleware: Extracts user if token present, continues without
- `requireAuth` middleware: Rejects requests without valid token (401)
- Admin-only endpoints check `user.role === 'admin'` (403 if not admin)

## Security Features

### Password Security
- Passwords never stored in plaintext
- bcrypt hashing with 12 rounds (strong, industry-standard)
- Password validation enforces minimum 6 characters

### Token Security
- JWT secret is environment-protected (not hardcoded)
- Tokens expire automatically after 7 days
- Token signature prevents tampering
- Token payload contains only user ID (no sensitive data)

### Input Validation
- express-validator sanitizes all authentication inputs
- Email format validation
- Username length validation (3-50 characters)
- Password length validation (minimum 6 characters)

### Error Handling
- Generic error messages prevent information leakage
- Invalid credentials return same error for email/password (no username enumeration)
- Duplicate registration blocked with 409 status
- All auth errors logged server-side

## Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  password  String   // bcrypt hashed
  firstName String?
  lastName  String?
  role      String   @default("user")
  lastLogin DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // ... additional fields
}
```

## Internationalization

All authentication UI and error messages support multiple languages (English, French) via i18n translation keys.

## Audit Logging

All authentication events are tracked:
- User registrations (CREATE action)
- Login attempts are logged via `lastLogin` timestamp
- Account changes are audited (role changes, profile updates)

---

See also: [API Documentation](api.md), [Design](design.md), [Requirements](requirements.md), [Test Cases](test.md)
```
