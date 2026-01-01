# Favourites Test Cases

## API Test Cases
1. `POST /api/roasters/:id/favourite` adds a roaster to favourites (authenticated).
2. `DELETE /api/roasters/:id/favourite` removes a roaster from favourites (authenticated).
3. `GET /api/roasters?favourites=true` returns all favourited roasters for the user.
4. Unauthenticated requests to favourite endpoints return 401.
5. Favoriting a non-existent roaster returns 404.

## UI Test Cases
1. Clicking the heart icon adds/removes a favourite and updates the UI.
2. The favourites page displays all favourited roasters.
3. Favourites persist after page reload (localStorage or backend).
4. Logging in merges localStorage favourites with backend.
5. Removing a favourite updates the list immediately.

See also: [API](api.md), [Design](design.md), [Overview](overview.md), [Requirements](requirements.md)
