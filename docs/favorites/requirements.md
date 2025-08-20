# Favorites Requirements

## Functional Requirements
1. Users can add or remove roasters from favorites.
2. Favorites are persisted in localStorage for guests and in the backend for authenticated users.
3. Users can view all their favorites on a dedicated page.
4. Favorites sync with the backend upon login.
5. The UI updates in real time when favorites change.

## Non-Functional Requirements
- Favorites must persist across sessions.
- API must validate authentication and roaster existence.
- UI must be responsive and accessible.

## User Stories
- As a user, I want to save my favorite roasters so I can find them easily later.
- As a user, I want my favorites to sync when I log in.
- As a guest, I want my favorites to persist in my browser.

See also: [API](api.md), [Design](design.md), [Overview](overview.md), [Test Cases](test.md)
