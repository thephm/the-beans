# Favorites Design

This document describes the technical design and architecture of the favorites feature.

## Frontend
- **Favorites State:** Managed in React state and localStorage for guests; synced with backend for authenticated users.
- **UI Components:** Heart icon/button on roaster cards and detail pages; dedicated Favorites page.
- **Sync Logic:** On login, merges localStorage favorites with backend.

## Backend
- **Favorites Table:** Stores user-roaster relationships.
- **Endpoints:**
  - `POST /api/roasters/:id/favorite` to add
  - `DELETE /api/roasters/:id/favorite` to remove
  - `GET /api/roasters?favorites=true` to list
- **isFavorited Field:** Included in roaster detail responses for authenticated users.

## Error Handling
- Handles unauthenticated access, missing roasters, and server errors.

See also: [API](api.md), [Overview](overview.md), [Requirements](requirements.md), [Test Cases](test.md)
