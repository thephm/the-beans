# Profile Design

This document describes the technical design and architecture for the profile feature.

## Frontend (Next.js/React)
- The profile page (`/profile`) is a protected route, accessible only to authenticated users.
- Uses `AuthContext` to provide user data and authentication state.
- Displays user info (name, email, username, avatar, language) and allows editing.
- Form fields are pre-filled with current user data.
- On save, sends updated data to the backend via API calls.
- Uses i18n for translations and language selection.

## Backend (Express + Prisma)
- Endpoints under `/api/users` handle profile data and settings.
- Requires JWT authentication for all profile endpoints.
- User data is stored in the `User` model (see schema below).
- Settings are stored in-memory for demo, but should be persisted in a database in production.
- Language preference is updated in the database via `/api/users/language`.

## Data Model (Prisma)
```prisma
model User {
	id        String   @id @default(cuid())
	email     String   @unique
	username  String   @unique
	password  String
	firstName String?
	lastName  String?
	avatar    String?
	language  String   @default("en") @db.VarChar(5)
	...
}
```


## Security
- All profile endpoints require a valid JWT token.
- User data is only accessible to the authenticated user.

---

See also: [API](api.md), [Overview](overview.md), [Requirements](requirements.md), [Test Cases](test.md)
