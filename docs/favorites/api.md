# Favorites API

This document describes the API endpoints and contracts for the favorites feature.

## Implementation

Favorites are currently managed **client-side only** using `localStorage`. There are no dedicated backend favorites endpoints.

### LocalStorage (Client-Side Only)
- **Key**: `favoriteRoasters`
- **Value**: Array of roaster IDs (as strings) `["1", "2", "3"]`
- **Used for**: All favorite functionality, persistence, and cross-page state

### Current API Integration

#### `GET /api/roasters/:id`
- Returns roaster details with basic information
- **Note**: Does NOT include `isFavorited` field - this is calculated client-side
- Example response:
```json
{
  "id": 1,
  "name": "Roaster Name",
  "description": "...",
  "address": "...",
  "specialties": ["Direct Trade", "Light Roast"]
}
```

#### Favorites Logic (Client-Side)
- **Add/Remove**: Updates localStorage array and React state
- **Persistence**: Survives page reloads via localStorage
- **Cross-Page Sync**: All pages read from same localStorage key
- **No Authentication Required**: Works for all users

### Missing Backend Features
The following endpoints are documented but **do not exist**:
- ❌ `POST /api/roasters/:id/favorite` 
- ❌ `DELETE /api/roasters/:id/favorite`
- ❌ `GET /api/roasters?favorites=true`

### Future Backend Implementation
When backend favorites are added, they should:
- Sync with localStorage on login/logout
- Provide user-specific favorite persistence
- Include `isFavorited` field in roaster responses

---

### Error Responses
- `401 Unauthorized`: Not logged in
- `404 Not Found`: Roaster does not exist
- `500 Internal Server Error`: Unexpected error

---

See also: [Favorites Design](design.md), [Overview](overview.md), [Requirements](requirements.md), [Test Cases](test.md)
