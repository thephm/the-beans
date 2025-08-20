# Search Design

This document describes the technical design and architecture of the search feature.

## Frontend
- **Component:** `SearchSection` in React (Next.js)
	- Handles user input, specialty pills, location, and triggers search via props/callbacks.
	- Debounces input to avoid excessive API calls.
	- Integrates with Discover page to auto-populate filters from URL params.

## Backend
- **API:** Express.js routes in `server/src/routes/search.ts`
	- `/api/search`: General search by query string and optional geolocation.
	- `/api/search/roasters`: Filtered search by specialty, location, and sort options.
	- Uses Prisma ORM to query the database.
	- Supports specialty translation (French/English) for internationalization.
	- Calculates distance if coordinates are provided.

## Data Model
- **Roaster:**
	- Fields: id, name, description, city, state, specialties (array), latitude, longitude, images, owner, reviews, etc.

## Error Handling
- Returns 400 for invalid parameters, 500 for server errors.

## Extensibility
- Easily extendable to support more filters, additional entity types, or advanced search (e.g., fuzzy matching).


See also: [API](api.md), [Overview](overview.md), [Requirements](requirements.md), [Test Cases](test.md)
