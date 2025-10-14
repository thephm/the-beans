# Roaster Owner Contact Fields

## Overview

The Beans now supports detailed owner contact information for roasters, allowing for richer roaster profiles and better communication between users and roaster owners.

## New Fields

The following optional fields have been added to the `Roaster` model:

- **`ownerName`** (string, optional): The full name of the roaster owner
- **`ownerEmail`** (string, optional): Email address of the roaster owner (must be a registered user email if provided)
- **`ownerBio`** (text, optional): Biography or description of the roaster owner
- **`ownerMobile`** (string, optional): Mobile phone number of the roaster owner

## Implementation Details

### Database Schema
```prisma
model Roaster {
  // ... existing fields
  ownerName   String?
  ownerEmail  String?
  ownerBio    String?
  ownerMobile String?
}
```

### API Endpoints
All existing roaster endpoints now support the new owner contact fields:

- **`POST /api/roasters`**: Include owner fields in request body
- **`PUT /api/roasters/:id`**: Update owner fields
- **`GET /api/roasters`**: Owner fields returned in response (admin auth required for unverified roasters)
- **`GET /api/roasters/:id`**: Owner fields included in roaster details

### Frontend Integration
- **Admin roaster creation/edit forms**: Include form fields for all owner contact information
- **Roaster detail pages**: Display owner information when available
- **Form validation**: Validates owner email against existing users if provided

### Data Import Support
The `post-roasters.py` script fully supports the new owner contact fields:

```json
{
  "name": "Example Roastery",
  "ownerName": "John Doe",
  "ownerBio": "Master roaster with 15 years experience",
  "ownerMobile": "+1-555-123-4567",
  // ... other roaster fields
}
```

## Validation Rules

- **ownerEmail**: Must be an email address of an existing registered user
- **ownerName**: Free text, no specific validation
- **ownerBio**: Free text, suitable for longer descriptions
- **ownerMobile**: Free text, accepts various phone number formats

## Access Control

- **Public users**: Can view owner information for verified roasters only
- **Admin users**: Can view owner information for all roasters (verified and unverified)
- **Admin users**: Can create and edit owner contact information through admin interface

## Audit Logging

All changes to owner contact fields are tracked in the audit logging system:
- Creation of roasters with owner fields
- Updates to existing owner contact information
- Field-level change tracking in audit log details

---

See also: [API Documentation](api.md), [Design](design.md), [Requirements](requirements.md)