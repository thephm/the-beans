# Search Feature

The search feature allows users to find coffee roasters using a variety of filters and keywords. It is accessible from the home page and the Discover page.

## Main Capabilities
- **Keyword Search:** Search by roaster name, description, city, state, or specialty.
- **Specialty Filter:** Filter by coffee specialties (e.g., Espresso, Single Origin, Cold Brew, Fair Trade, Organic, etc.).
- **Location Filter:** Filter by city, state, or address. Optionally, use geolocation (latitude/longitude) and radius.
- **Popular Searches:** Quick access to common specialty searches via UI pills.
- **Sorting:** Sort results by name, rating, review count, or city.
- **Distance Filter:** Limit results to a radius (in miles) from a given location.

## User Flow
1. User enters a search term and/or selects filters.
2. Search can be triggered by pressing Enter, clicking the search button, or clicking a specialty pill.
3. Results are displayed and can be further refined.

## Integration
- The search UI is implemented in the `SearchSection` React component.
- The backend exposes `/api/search` and `/api/search/roasters` endpoints.

See also: [API](api.md), [Design](design.md), [Requirements](requirements.md), [Test Cases](test.md)
