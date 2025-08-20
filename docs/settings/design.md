
Technical design and architecture for settings.

# Settings Design

## Frontend
- Built with React (Next.js)
- Uses controlled components for all form fields
- State managed with `useState` and loaded from the API on page load
- Form submission triggers a PUT request to `/api/users/settings`
- Success and error feedback provided to the user

## Backend
- Express route `/api/users/settings` (GET, PUT)
- Requires authentication middleware
- Settings stored in an in-memory object (for now); in production, use a database
- Returns defaults if no settings are saved
- Logs all operations for debugging

## Data Model
```json
{
	"notifications": {
		"newRoasters": true,
		"promotions": true,
		"recommendations": false
	},
	"privacy": {
		"showProfile": true,
		"allowLocationTracking": false
	},
	"preferences": {
		"roastLevel": "no-preference",
		"brewingMethods": {
			"espresso": false,
			"pourOver": false,
			"frenchPress": false,
			"coldBrew": false
		}
	}
}
```
