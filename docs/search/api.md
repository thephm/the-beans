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
      ...
    }
  ],
  "total": 0
}
```

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

See also: [Search Design](design.md), [Overview](overview.md), [Requirements](requirements.md), [Test Cases](test.md)
