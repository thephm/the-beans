# Search Requirements

## Functional Requirements
1. Users can search for roasters by keyword (name, description, city, state, specialty).
2. Users can filter results by specialty (e.g., Espresso, Single Origin, etc.).
3. Users can filter results by location (city, state, address, or geolocation).
4. Users can limit results to a radius from a given location.
5. Users can sort results by name, rating, review count, or city.
6. Users can trigger search by pressing Enter, clicking the search button, or clicking a specialty pill.
7. The system must support internationalization (French/English specialty mapping).
8. The system must return relevant results quickly (debounced search on frontend).

## Non-Functional Requirements
- API must validate input and return appropriate error codes.
- Search must be performant for large datasets.
- UI must be responsive and accessible.

## User Stories
- As a user, I want to search for roasters by keyword so I can find specific businesses.
- As a user, I want to filter by specialty so I can find roasters with my preferred coffee types.
- As a user, I want to search by location or use my current location to find nearby roasters.
- As a user, I want to see popular searches and use them quickly.
- As a user, I want to sort results to find the best or closest roasters.

See also: [API](api.md), [Design](design.md), [Overview](overview.md), [Test Cases](test.md)
