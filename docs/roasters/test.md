
Test cases and scenarios for roasters.

# Roasters Test Cases

## API Tests
- [ ] GET /api/roasters returns paginated list with correct filters and sorting
- [ ] GET /api/roasters/{id} returns correct roaster details or 404 if not found
- [ ] POST /api/roasters creates a new roaster (auth required)
- [ ] POST /api/roasters with `socialNetworks` saves social links correctly
- [ ] POST /api/people creates a roaster contact with roles and contact details
- [ ] Unauthorized POST /api/roasters is rejected
- [ ] Location-based filtering returns only roasters within radius
- [ ] GET /api/people/roaster/{roasterId} returns contacts for a roaster

## UI Tests
- [ ] Roaster list page displays all roasters with correct info
- [ ] Sorting and filtering update the list as expected
- [ ] Roaster detail page shows all fields, specialties, and contact info
- [ ] People/CRM contact information (name, title, bio, mobile) displays correctly when available
- [ ] Admin people/contact forms support contact roles and primary contact state
- [ ] People/CRM contact validation works in admin forms
- [ ] Favoriting/unfavoriting works and persists in localStorage
- [ ] No roasters found message appears when appropriate

## Integration Tests
- [ ] Creating a roaster via UI adds it to the list
- [ ] Creating a People/CRM contact via admin UI saves and displays correctly
- [ ] Python script (post-roasters.py) works with current roaster fields and `socialNetworks`
- [ ] Contact changes are included in audit logs when people records are created/updated
- [ ] Favoriting a roaster updates both UI and localStorage
- [ ] Internationalization: UI and specialty names change with language

---

See also: [API](api.md), [Design](design.md), [Overview](overview.md), [Requirements](requirements.md)
