# Auth Design

## Overview

Authentication is implemented using JWT tokens and secure password hashing. The backend exposes RESTful endpoints for registration, login, and user info. The frontend manages authentication state and token storage.

## Backend

- **Framework:** Node.js, Express, Prisma ORM
- **Password Hashing:** bcrypt (12 rounds)
- **Token:** JWT (7-day expiry, signed with server secret)
- **Login Tracking:** Updates user's `lastLogin` timestamp on successful authentication
- **Endpoints:**
	- `POST /api/auth/register` — Register new user
	- `POST /api/auth/login` — Login and receive JWT (updates lastLogin timestamp)
	- `GET /api/auth/me` — Get current user info (requires Bearer token)
- **Validation:** express-validator for all inputs
- **Error Handling:** Returns 400/401/409 for invalid input, credentials, or duplicate users

## Frontend

- **Framework:** Next.js (React)
- **State:** AuthContext manages user and token
- **Token Storage:** JWT stored in localStorage
- **Login/Signup:** Forms POST to backend endpoints
- **Logout:** Removes token and user from localStorage
- **Protected Routes:** UI checks isAuthenticated from context

## Security

- Passwords never stored in plaintext
- JWT secret is environment-protected
- All sensitive endpoints require valid JWT
- Input validation and error handling on all auth routes

---

See also: [API](api.md), [Overview](overview.md), [Requirements](requirements.md), [Test Cases](test.md)
