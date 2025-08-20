
API endpoints and contracts for settings.

# Settings API

This document describes the API endpoints for managing user settings (notifications, privacy, and coffee preferences).

## Endpoints

### GET `/api/users/settings`
- **Description:** Get the current user's settings (notifications, privacy, preferences).
- **Auth:** Required (JWT)
- **Response:**
```json
{
	"settings": {
		"notifications": { ... },
		"privacy": { ... },
		"preferences": { ... }
	}
}
```

### PUT `/api/users/settings`
- **Description:** Update the current user's settings.
- **Auth:** Required (JWT)
- **Request Body:**
```json
{
	"notifications": { ... },
	"privacy": { ... },
	"preferences": { ... }
}
```
- **Response:**
```json
{
	"success": true,
	"message": "Settings updated successfully",
	"settings": { ... }
}

**Notes:**

```

---

See also: [Settings Design](design.md), [Overview](overview.md), [Requirements](requirements.md), [Test Cases](test.md)
