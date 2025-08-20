# Search Test Cases

## API Test Cases
1. `GET /api/search?q=Espresso` returns roasters matching "Espresso" in name, description, city, state, or specialties.
2. `GET /api/search/roasters?specialty=Cold%20Brew` returns roasters with "Cold Brew" specialty.
3. `GET /api/search/roasters?location=Toronto` returns roasters in Toronto.
4. `GET /api/search/roasters?latitude=43.7&longitude=-79.4&radius=10` returns roasters within 10 miles of coordinates.
5. `GET /api/search/roasters?sort=-rating` returns roasters sorted by rating descending.
6. Invalid query (e.g., missing `q` in `/api/search`) returns 400 error.
7. Invalid sort value returns 400 error.
8. Server error returns 500 error.

## UI Test Cases
1. Typing a search term and pressing Enter triggers a search and displays results.
2. Clicking a specialty pill triggers a search for that specialty.
3. Entering a location and pressing Enter filters results by location.
4. Changing filters updates results after debounce delay.
5. Results update when sorting is changed.
6. UI displays error messages for invalid input or server errors.

See also: [API](api.md), [Design](design.md), [Overview](overview.md), [Requirements](requirements.md)
