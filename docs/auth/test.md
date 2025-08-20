# Auth Test Cases


## Registration

- Register with valid email, username, and password → Success, receives token
- Register with existing email or username → Fails with `409`
- Register with invalid email or short password → Fails with `400`

## Login

- Login with valid credentials → Success, receives token
- Login with wrong password or email → Fails with `401`
- Login with missing fields → Fails with `400`

## Authenticated User

- Access `/api/auth/me` with valid token → Returns user info
- Access `/api/auth/me` with invalid or missing token → Fails with `401`

## UI

- Login and signup forms show error messages for invalid input
- User is redirected to discover page after login
- User is redirected to home after signup
- Logout removes token and user info from localStorage
