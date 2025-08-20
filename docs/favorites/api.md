# Favorites API

This document describes the API endpoints and contracts for the favorites feature.

## Implementation

Favorites are managed on the client side using `localStorage` and on the backend via the `/api/roasters` endpoints (for authenticated users).

### LocalStorage (Client)
- Key: `favoriteRoasters`
- Value: Array of roaster IDs (as strings)
- Used for quick access and offline support.

### Backend (Authenticated Users)
- Favorites are stored in the database and associated with the user.
- Endpoints:

#### `GET /api/roasters/:id`
- Returns roaster details, including `isFavorited` (if authenticated).
- Example response:
```json
{
  "id": 1,
  "name": "Roaster Name",
  ...,
  "isFavorited": true
}
```

#### `POST /api/roasters/:id/favorite`
- Adds the roaster to the user's favorites.
- Requires authentication (Bearer token).
- Response: `{ success: true }`

#### `DELETE /api/roasters/:id/favorite`
- Removes the roaster from the user's favorites.
- Requires authentication.
- Response: `{ success: true }`

#### `GET /api/roasters?favorites=true`
- Returns all roasters favorited by the authenticated user.

---

### Error Responses
- `401 Unauthorized`: Not logged in
- `404 Not Found`: Roaster does not exist
- `500 Internal Server Error`: Unexpected error

---

See also: [Favorites Design](design.md), [Overview](overview.md), [Requirements](requirements.md), [Test Cases](test.md)
