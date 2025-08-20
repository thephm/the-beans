
Test cases and scenarios for settings.

# Settings Test Cases

## Manual Test Scenarios

### 1. Load Settings
- Login as a user
- Navigate to /settings
- Verify current settings are loaded (defaults if first time)

### 2. Update Settings
- Change notification, privacy, and coffee preferences
- Click "Save Settings"
- Success message should appear
- Refresh page and verify changes persist

### 3. Authentication
- Try to access /settings when not logged in
- Should redirect to login page

### 4. API Error Handling
- Simulate API failure (e.g., stop backend)
- Attempt to save settings
- Error message should appear

## Automated Test Ideas
- GET /api/users/settings returns correct settings for authenticated user
- PUT /api/users/settings updates and persists settings
- Unauthenticated requests are rejected
