# Auth Requirements


## Functional Requirements

- Users must be able to register with email, username, password, first name, and last name.
- Users must be able to log in with email and password.
- Passwords must be securely hashed before storage.
- Users must receive a JWT token upon successful registration or login.
- Users must be able to log out (client-side token removal).
- Users must be able to view their profile information after logging in.
- Duplicate email or username registration must be prevented.
- Error messages must be shown for invalid credentials or registration errors.
- The system must support internationalization for all auth-related UI and errors.

## Non-Functional Requirements

- Passwords must be stored using a strong hashing algorithm (bcrypt, 12+ rounds).
- JWT tokens must be signed with a secure secret and expire after 7 days.
- All sensitive API endpoints must require authentication via Bearer token.
- Input validation must be enforced on all auth endpoints.

## User Stories

- As a new user, I want to sign up so I can access personalized features.
- As a user, I want to log in so I can access my account and favorites.
- As a user, I want to log out to keep my account secure.
-- As a user, I want to see clear error messages if I enter invalid credentials or try to register with an existing email/username.

---

See also: [API](api.md), [Design](design.md), [Overview](overview.md), [Test Cases](test.md)
