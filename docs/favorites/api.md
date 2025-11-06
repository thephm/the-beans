````markdown# Favorites API

# Favorites API

This document describes the API endpoints and contracts for the favorites feature.

## ⚠️ Client-Side Only Implementation

## Implementation

Favorites are currently managed **entirely client-side** using `localStorage`. There are **no backend API endpoints** for favorites functionality.

Favorites are currently managed **client-side only** using `localStorage`. There are no dedicated backend favorites endpoints.

### Implementation Details

### LocalStorage (Client-Side Only)

#### LocalStorage Storage- **Key**: `favoriteRoasters`

- **Key**: `favoriteRoasters`- **Value**: Array of roaster IDs (as strings) `["1", "2", "3"]`

- **Value**: Array of roaster IDs (as strings) `["roaster_id_1", "roaster_id_2", "roaster_id_3"]`- **Used for**: All favorite functionality, persistence, and cross-page state

- **Persistence**: Survives page reloads and browser restarts

- **Scope**: Per-browser, not synced across devices### Current API Integration



#### How It Works#### `GET /api/roasters/:id`

1. **Add Favorite**: Append roaster ID to localStorage array- Returns roaster details with basic information

2. **Remove Favorite**: Filter roaster ID from localStorage array  - **Note**: Does NOT include `isFavorited` field - this is calculated client-side

3. **Check Favorite**: Search for roaster ID in localStorage array- Example response:

4. **List Favorites**: Read entire array from localStorage```json

{

#### Frontend Usage  "id": 1,

```typescript  "name": "Roaster Name",

// Check if roaster is favorited  "description": "...",

const favorites = JSON.parse(localStorage.getItem('favoriteRoasters') || '[]');  "address": "...",

const isFavorited = favorites.includes(roasterId);  "specialties": ["Direct Trade", "Light Roast"]

}

// Add to favorites```

favorites.push(roasterId);

localStorage.setItem('favoriteRoasters', JSON.stringify(favorites));#### Favorites Logic (Client-Side)

- **Add/Remove**: Updates localStorage array and React state

// Remove from favorites- **Persistence**: Survives page reloads via localStorage

const updated = favorites.filter(id => id !== roasterId);- **Cross-Page Sync**: All pages read from same localStorage key

localStorage.setItem('favoriteRoasters', JSON.stringify(updated));- **No Authentication Required**: Works for all users

```

### Missing Backend Features

### Integration with Roasters APIThe following endpoints are documented but **do not exist**:

- ❌ `POST /api/roasters/:id/favorite` 

#### `GET /api/roasters/:id`- ❌ `DELETE /api/roasters/:id/favorite`

Returns roaster details. The `isFavorited` status is **calculated client-side** by checking localStorage.- ❌ `GET /api/roasters?favorites=true`



**Response:**### Future Backend Implementation

```jsonWhen backend favorites are added, they should:

{- Sync with localStorage on login/logout

  "id": "roaster_123",- Provide user-specific favorite persistence

  "name": "Blue Bottle Coffee",- Include `isFavorited` field in roaster responses

  "description": "Specialty coffee roaster",

  "address": "...",---

  "specialties": ["Direct Trade", "Light Roast"]

}### Error Responses

```- `401 Unauthorized`: Not logged in

- `404 Not Found`: Roaster does not exist

**Note**: No `isFavorited` field in response - must be determined by client.- `500 Internal Server Error`: Unexpected error



#### Filtering Favorites---

To show only favorited roasters:

1. Get favorite IDs from localStorageSee also: [Favorites Design](design.md), [Overview](overview.md), [Requirements](requirements.md), [Test Cases](test.md)

2. Fetch roaster details for each ID
3. Filter/display in UI

### Limitations
- ❌ No authentication required (anyone can favorite)
- ❌ Not synced across devices/browsers
- ❌ Lost if browser data is cleared
- ❌ Cannot query "all my favorites" from backend
- ❌ No server-side favorite counts

### Future Backend Implementation

When favorites are moved to the backend, the system should provide:
- User-specific favorites (requires authentication)
- Sync across devices
- API endpoints:
  - `POST /api/favorites/:roasterId` - Add favorite
  - `DELETE /api/favorites/:roasterId` - Remove favorite
  - `GET /api/favorites` - List user's favorites
  - `GET /api/roasters?favorited=true` - Filter favorited roasters
- Migration path from localStorage to database

---

See also: [Favorites Design](design.md), [Overview](overview.md), [Requirements](requirements.md), [Test Cases](test.md)

````
