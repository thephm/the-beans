# Deprecated Roaster Owner Contact Fields

Direct owner contact fields on `Roaster` (`ownerName`, `ownerEmail`, `ownerBio`, `ownerMobile`) are deprecated and are not part of the current Prisma `Roaster` model.

Use the People/CRM system instead. Roaster contacts are stored as `RoasterPerson` records and managed through the People API.

## Current Model

`RoasterPerson` supports:

- Multiple contacts per roaster
- Optional linking to a registered `User`
- Roles such as owner, admin, roaster, employee, billing, marketing, scout, and customer
- Contact fields including first name, last name, title, email, mobile, LinkedIn URL, Instagram URL, and bio
- Primary contact and active/inactive status

## Current API

Use these endpoints for roaster contacts:

- `GET /api/people/roaster/:roasterId` - get people for a roaster
- `GET /api/people/:id` - get one person
- `POST /api/people` - create a person/contact
- `PUT /api/people/:id` - update a person/contact
- `DELETE /api/people/:id` - delete a person/contact

Roaster create/update endpoints may still accept some legacy fields for backward compatibility, but current clients should manage contacts through `/api/people`.

See also: [api.md](api.md), [design.md](design.md), [requirements.md](requirements.md)
