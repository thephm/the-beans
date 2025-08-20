
Test cases and scenarios for roasters.

# Roasters Test Cases

## API Tests
- [ ] GET /api/roasters returns paginated list with correct filters and sorting
- [ ] GET /api/roasters/{id} returns correct roaster details or 404 if not found
- [ ] POST /api/roasters creates a new roaster (auth required)
- [ ] Unauthorized POST /api/roasters is rejected
- [ ] Location-based filtering returns only roasters within radius

## UI Tests
- [ ] Roaster list page displays all roasters with correct info
- [ ] Sorting and filtering update the list as expected
- [ ] Roaster detail page shows all fields, specialties, and contact info
- [ ] Favoriting/unfavoriting works and persists in localStorage
- [ ] No roasters found message appears when appropriate

## Integration Tests
- [ ] Creating a roaster via UI adds it to the list
- [ ] Favoriting a roaster updates both UI and localStorage
- [ ] Internationalization: UI and specialty names change with language

---

See also: [API](api.md), [Design](design.md), [Overview](overview.md), [Requirements](requirements.md)
