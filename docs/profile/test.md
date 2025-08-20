# Profile Test Cases

## Manual Test Scenarios
1. **View Profile (Authenticated):**
	- Log in and navigate to `/profile`
	- Verify user info (name, email, username, language) is displayed

2. **Edit Profile Info:**
	- Change first name, last name, email, or username
	- Click save and verify changes are reflected in UI and backend

3. **Update Language Preference:**
	- Change language and verify app updates language and persists preference

4. **Manage Settings:**
	- Update notification, privacy, or coffee preferences
	- Save and verify settings are updated

5. **Access Control:**
	- Try to access `/profile` when not logged in; should redirect to login

6. **API Auth:**
	- Call profile API endpoints without a token; should return 401

## Automated Test Ideas
- Unit test AuthContext for correct user state management
- Integration test API endpoints for settings and language update
- E2E test: login, update profile, verify persistence

---

See also: [API](api.md), [Design](design.md), [Overview](overview.md), [Requirements](requirements.md)
