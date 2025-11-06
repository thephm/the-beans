
# Profile API

This document describes the API endpoints and contracts for the user profile feature.

## Authentication
All profile endpoints require authentication via a Bearer token in the `Authorization` header.

## Endpoints

### GET `/api/users/settings`
**Description:** Get the current user's profile settings (notifications, privacy, preferences).

**Auth:** Required

**Response:**
```json
{
	"settings": {
		"notifications": { ... },
		"privacy": { ... },
		"preferences": { ... }
	}
}
```

---

### PUT `/api/users/settings`
**Description:** Update the current user's profile settings.

**Auth:** Required

**Request Body:**
```json
{
	"notifications": { ... },
	"privacy": { ... },
	"preferences": { ... }
}
```

**Response:**
```json
{
	"success": true,
	"message": "Settings updated successfully",
	"settings": { ... }
}
```

---

### PUT `/api/users/language`
**Description:** Update the user's language preference.

**Auth:** Required

**Request Body:**
```json
{
	"language": "en"
}
```

**Response:**
```json
{
	"message": "Language preference updated successfully",
	"language": "en"
}
```

---

### GET `/api/users/`
**Description:** Placeholder endpoint for user listing (not implemented).

**Response:**
```json
{
	"message": "Users endpoint - coming soon!"
}
```

---

See also: [Profile Design](design.md), [Overview](overview.md), [Requirements](requirements.md), [Test Cases](test.md)
