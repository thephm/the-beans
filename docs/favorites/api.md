```markdown

# Favourites API

This document describes the API endpoints and contracts for the favourites feature.

## Client-Side Only Implementation

## Implementation

Favourites are currently managed **entirely client-side** using `localStorage`. There are **no backend API endpoints** for favourites functionality.

Favourites are currently managed **client-side only** using `localStorage`. There are no dedicated backend favourites endpoints.

### Implementation Details

### LocalStorage (Client-Side Only)

#### LocalStorage Storage- **Key**: `favouriteRoasters`

- **Key**: `favouriteRoasters`- **Value**: Array of roaster IDs (as strings) `["1", "2", "3"]`

- **Value**: Array of roaster IDs (as strings) `["roaster_id_1", "roaster_id_2", "roaster_id_3"]`- **Used for**: All favourite functionality, persistence, and cross-page state

- **Persistence**: Survives page reloads and browser restarts

- **Scope**: Per-browser, not synced across devices### Current API Integration

#### How It Works#### `GET /api/roasters/:id`

1. **Add Favourite**: Append roaster ID to localStorage array- Returns roaster details with basic information

2. **Remove Favourite**: Filter roaster ID from localStorage array  - **Note**: Does NOT include `isFavourited` field - this is calculated client-side

3. **Check Favourite**: Search for roaster ID in localStorage array- Example response:

4. **List Favourites**: Read entire array from localStorage```json

{

#### Frontend Usage  "id": 1,

```typescript  "name": "Roaster Name",

// Check if roaster is favourited  "description": "...",

const favourites = JSON.parse(localStorage.getItem('favouriteRoasters') || '[]');  "address": "...",

const isFavourited = favourites.includes(roasterId);  "specialties": ["Direct Trade", "Light Roast"]

}

// Add to favourites

```
favourites.push(roasterId);

localStorage.setItem('favouriteRoasters', JSON.stringify(favourites));#### Favourites Logic (Client-Side)

- **Add/Remove**: Updates localStorage array and React state

// Remove from favourites- **Persistence**: Survives page reloads via localStorage

const updated = favourites.filter(id => id !== roasterId);- **Cross-Page Sync**: All pages read from same localStorage key

localStorage.setItem('favouriteRoasters', JSON.stringify(updated));- **No Authentication Required**: Works for all users

```

### Missing Backend Features

### Integration with Roasters APIThe following endpoints are documented but **do not exist**:

- `POST /api/roasters/:id/favourite` 

#### `GET /api/roasters/:id`- `DELETE /api/roasters/:id/favourite`

Returns roaster details. The `isFavourited` status is **calculated client-side** by checking localStorage.- `GET /api/roasters?favourites=true`

**Response:**### Future Backend Implementation

```jsonWhen backend favourites are added, they should:

{- Sync with localStorage on login/logout

  "id": "roaster_123",- Provide user-specific favourite persistence

  "name": "Blue Bottle Coffee",- Include `isFavourited` field in roaster responses

  "description": "Specialty coffee roaster",

  "address": "...",---

  "specialties": ["Direct Trade", "Light Roast"]

}### Error Responses

```- `401 Unauthorized`: Not logged in

- `404 Not Found`: Roaster does not exist

**Note**: No `isFavourited` field in response - must be determined by client.- `500 Internal Server Error`: Unexpected error



#### Filtering Favourites---

To show only favourited roasters:

1. Get favourite IDs from localStorageSee also: [Favourites Design](design.md), [Overview](overview.md), [Requirements](requirements.md), [Test Cases](test.md)

2. Fetch roaster details for each ID
3. Filter/display in UI

### Limitations
- No authentication required (anyone can favourite)
- Not synced across devices/browsers
- Lost if browser data is cleared
- Cannot query "all my favourites" from backend
- No server-side favourite counts

### Future Backend Implementation

When favourites are moved to the backend, the system should provide:
- User-specific favourites (requires authentication)
- Sync across devices
- API endpoints:
  - `POST /api/favourites/:roasterId` - Add favourite
  - `DELETE /api/favourites/:roasterId` - Remove favourite
  - `GET /api/favourites` - List user's favourites
  - `GET /api/roasters?favourited=true` - Filter favourited roasters
- Migration path from localStorage to database

---

See also: [Favourites Design](design.md), [Overview](overview.md), [Requirements](requirements.md), [Test Cases](test.md)

````
