
API endpoints and contracts for roasters.

# Roasters API

This document describes the REST API endpoints for managing and retrieving roaster data.

## Endpoints

### `GET /api/roasters`
Returns a paginated list of roasters. Supports filtering and sorting.

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 20)
- `search` (string, optional)
- `city` (string, optional)
- `state` (string, optional)
- `specialty` (string, optional)
- `latitude`, `longitude` (number, optional) — for location-based filtering
- `radius` (number, default: 50) — miles for location search
- `sort` (string, options: name, -name, -rating, -reviewCount, city)

**Response:**
```json
{
	"roasters": [ { ...roaster fields... } ],
	"pagination": { "page": 1, "limit": 20, "total": 100, "pages": 5 }
}
```

### `GET /api/roasters/{id}`
Returns details for a single roaster by ID.

**Response:**
```json
{
	...roaster fields...,
	"isFavorited": true|false
}
```

### `POST /api/roasters`
Create a new roaster (requires authentication).

**Body:**
```json
{
	"name": "...",
	"description": "...",
	"email": "...",
	"phone": "...",
	"website": "...",
	"address": "...",
	"city": "...",
	"state": "...",
	"zipCode": "...",
	"latitude": 0,
	"longitude": 0,
	"specialties": ["Espresso", ...]
}
```

**Response:**
```json
{
	"message": "Roaster created successfully",
	"roaster": { ...roaster fields... }
}
```

## Roaster Object Fields

- `id`, `name`, `description`, `email`, `phone`, `website`, `address`, `city`, `state`, `zipCode`, `country`, `latitude`, `longitude`, `images`, `hours`, `specialties`, `verified`, `featured`, `rating`, `reviewCount`, `owner`, `beans`, `reviews`, `_count`


See the Swagger (OpenAPI) documentation for full field details.

---

See also: [Design](design.md), [Overview](overview.md), [Requirements](requirements.md), [Test Cases](test.md)
