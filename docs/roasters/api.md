
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
	"isFavourited": true|false
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
	"founded": 2020,
	"specialties": ["Espresso", ...],
	"ownerEmail": "...",
	"instagram": "https://instagram.com/...",
	"tiktok": "https://tiktok.com/@...",
	"facebook": "https://facebook.com/...",
	"linkedin": "https://linkedin.com/company/...",
	"youtube": "https://youtube.com/@...",
	"threads": "https://threads.net/@...",
	"pinterest": "https://pinterest.com/...",
	"bluesky": "https://bsky.app/profile/...",
	"x": "https://x.com/...",
	"reddit": "https://reddit.com/r/..."
}
```

**Note:** Owner contact fields (ownerName, ownerBio, ownerMobile) are deprecated. Use the People/CRM API (`/api/people`) for managing roaster contacts. See [OWNER_CONTACT_FIELDS.md](OWNER_CONTACT_FIELDS.md) for details.

**Response:**
```json
{
	"message": "Roaster created successfully",
	"roaster": { ...roaster fields... }
}
```

### `PUT /api/roasters/{id}`
Update an existing roaster (requires authentication and ownership).

### `DELETE /api/roasters/{id}`
Delete a roaster (requires authentication and ownership).

### `GET /api/roasters/admin/unverified`
Get all unverified roasters (admin only).

### `PATCH /api/roasters/{id}/verify`
Verify a roaster (admin only).

### `GET /api/roasters/{id}/images`
Get all images for a roaster.

### `POST /api/roasters/{id}/images`
Upload a new image for a roaster (requires authentication and ownership).

### `PUT /api/roasters/{id}/images/{imageId}`
Update image details (requires authentication and ownership).

### `DELETE /api/roasters/{id}/images/{imageId}`
Delete an image (requires authentication and ownership).

## Roaster Object Fields

- `id`, `name`, `description`, `email`, `phone`, `website`, `address`, `city`, `state`, `zipCode`, `country`, `latitude`, `longitude`, `founded`, `images`, `hours`, `specialties`, `verified`, `featured`, `rating`, `reviewCount`, `owner`, `beans`, `reviews`, `people`, `_count`
- **Social Networks:** `instagram`, `tiktok`, `facebook`, `linkedin`, `youtube`, `threads`, `pinterest`, `bluesky`, `x`, `reddit`

**Note:** `people` field contains RoasterPerson objects (contacts/roles). Legacy owner contact fields are deprecated.


See the Swagger (OpenAPI) documentation for full field details.

---

See also: [Design](design.md), [Overview](overview.md), [Requirements](requirements.md), [Test Cases](test.md)
