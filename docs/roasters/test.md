
Test cases and scenarios for roasters.

# Roasters Test Cases

## API Tests
- [ ] GET /api/roasters returns paginated list with correct filters and sorting
- [ ] GET /api/roasters/{id} returns correct roaster details or 404 if not found
- [ ] POST /api/roasters creates a new roaster (auth required)
- [ ] POST /api/roasters with owner contact fields (ownerName, ownerBio, ownerMobile) saves correctly
- [ ] POST /api/roasters with invalid ownerEmail returns validation error
- [ ] Unauthorized POST /api/roasters is rejected
- [ ] Location-based filtering returns only roasters within radius
- [ ] Owner contact fields are returned in API responses when present

## UI Tests
- [ ] Roaster list page displays all roasters with correct info
- [ ] Sorting and filtering update the list as expected
- [ ] Roaster detail page shows all fields, specialties, and contact info
- [ ] Owner contact information (name, bio, mobile) displays correctly when available
- [ ] Admin roaster creation form includes owner contact fields
- [ ] Owner contact field validation works in admin forms
- [ ] Favoriting/unfavoriting works and persists in localStorage
- [ ] No roasters found message appears when appropriate

## Integration Tests
- [ ] Creating a roaster via UI adds it to the list
- [ ] Creating a roaster with owner contact fields via admin UI saves and displays correctly
- [ ] Python script (post-roasters.py) works with new owner contact fields
- [ ] Owner contact fields are included in audit logs when roasters are created/updated
- [ ] Favoriting a roaster updates both UI and localStorage
- [ ] Internationalization: UI and specialty names change with language

---

See also: [API](api.md), [Design](design.md), [Overview](overview.md), [Requirements](requirements.md)
