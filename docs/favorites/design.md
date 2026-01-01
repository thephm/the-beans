# Favourites Design

This document describes the technical design and architecture of the favourites feature.

## Frontend
- **Favourites State:** Managed in React state and localStorage for guests; synced with backend for authenticated users.
- **UI Components:** Heart icon/button on roaster cards and detail pages; dedicated Favourites page.
- **Sync Logic:** On login, merges localStorage favourites with backend.

## Backend
- **Favourites Table:** Stores user-roaster relationships.
- **Endpoints:**
  - `POST /api/roasters/:id/favourite` to add
  - `DELETE /api/roasters/:id/favourite` to remove
  - `GET /api/roasters?favourites=true` to list
- **isFavourited Field:** Included in roaster detail responses for authenticated users.

## Error Handling
- Handles unauthenticated access, missing roasters, and server errors.

See also: [API](api.md), [Overview](overview.md), [Requirements](requirements.md), [Test Cases](test.md)
