# Search API

This document describes the API endpoints and contracts for the search functionality.

## Endpoints

### `GET /api/search`

Search for roasters by query string and optional geolocation.

**Query Parameters:**
- `q` (string, required): Search query (matches name, description, city, state, specialties)
- `type` (string, optional): Only `roasters` is supported
- `latitude` (number, optional): Latitude for location-based filtering
- `longitude` (number, optional): Longitude for location-based filtering
- `radius` (number, optional, default: 25): Search radius in miles

**Response:**
```json
{
  "roasters": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "city": "string",
      "state": "string",
      "specialties": ["string"],
      "latitude": 0,
      "longitude": 0,
      "owner": { "id": "string", "username": "string" },
      "reviews": [{ "rating": 0 }],
      "matchType": "exact",
      "distance": 5.2,
      ...
    }
  ],
  "exact": [...],
  "radius": [...],
  "total": 0,
  "counts": {
    "exact": 15,
    "radius": 35
  }
}
```

**Progressive Loading:**

When both `latitude`, `longitude`, and `radius` are provided, results are split into two categories:

- **`exact`**: Roasters where the city name matches the search query (returned for immediate display)
- **`radius`**: Roasters within the radius that don't match the city name exactly (can be loaded progressively)
- **`roasters`**: Combined array with exact matches first, then radius matches
- **`matchType`**: Each roaster is tagged with either `'exact'` or `'radius'`
- **`distance`**: Distance in miles from the search coordinates (when coordinates provided)
- **`counts`**: Object containing count of exact and radius matches

This enables fast initial rendering of exact city matches followed by progressive loading of nearby results.

---

### `GET /api/search/roasters`

Search for roasters by specialty, location, and other filters.

**Query Parameters:**
- `specialty` (string, optional): Filter by specialty (supports French/English mapping)
- `location` (string, optional): Filter by city, state, or address
- `sort` (string, optional): Sort by `name`, `-name`, `-rating`, `-reviewCount`, `city`
- `latitude` (number, optional): Latitude for location-based filtering
- `longitude` (number, optional): Longitude for location-based filtering
- `radius` (number, optional, default: 25): Search radius in miles

**Response:**
```json
{
  "roasters": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "city": "string",
      "state": "string",
      "specialties": ["string"],
      "latitude": 0,
      "longitude": 0,
      "imageUrl": "string"
    }
  ],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 0,
    "totalPages": 1
  }
}
```

---

### Error Responses

- `400 Bad Request`: Invalid or missing parameters
- `500 Internal Server Error`: Unexpected server error

---


See also: [Design](design.md), [Overview](overview.md), [Requirements](requirements.md), [Test Cases](test.md)
