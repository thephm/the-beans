````markdown# ⚠️ DEPRECATED - Roaster Owner Contact Fields

# ⚠️ DEPRECATED - Roaster Owner Contact Fields

## 🔴 This Document is Outdated

## 🔴 This Document is Outdated

**As of November 2025**, the direct owner contact fields (ownerName, ownerEmail, ownerBio, ownerMobile) on the Roaster model have been **replaced** by the comprehensive **People/CRM system** using the `RoasterPerson` model.

**As of November 2025**, the direct owner contact fields (ownerName, ownerEmail, ownerBio, ownerMobile) on the Roaster model have been **replaced** by the comprehensive **People/CRM system** using the `RoasterPerson` model.

**For current implementation, see:**

**For current implementation, see:**- `server/prisma/schema.prisma` - RoasterPerson model

- `server/prisma/schema.prisma` - RoasterPerson model- `server/src/routes/people.ts` - People API implementation

- `server/src/routes/people.ts` - People API implementation

---

---

## Legacy Information (Historical Reference Only)

## Legacy Information (Historical Reference Only)

The following optional fields were **previously** added to the `Roaster` model but are **no longer used**:

The following optional fields were **previously** added to the `Roaster` model but are **no longer used**:

- ~~**`ownerName`** (string, optional): The full name of the roaster owner~~

- ~~**`ownerName`** (string, optional): The full name of the roaster owner~~- ~~**`ownerEmail`** (string, optional): Email address of the roaster owner~~

- ~~**`ownerEmail`** (string, optional): Email address of the roaster owner~~- ~~**`ownerBio`** (text, optional): Biography or description of the roaster owner~~

- ~~**`ownerBio`** (text, optional): Biography or description of the roaster owner~~- ~~**`ownerMobile`** (string, optional): Mobile phone number of the roaster owner~~

- ~~**`ownerMobile`** (string, optional): Mobile phone number of the roaster owner~~

## Migration to People/CRM System

## Migration to People/CRM System

These fields have been replaced by the `RoasterPerson` model which provides:

These fields have been replaced by the `RoasterPerson` model which provides:- **Multiple contacts per roaster** (not just one owner)

- **Multiple contacts per roaster** (not just one owner)- **Role-based management** (owner, admin, billing, etc.)

- **Role-based management** (owner, admin, billing, etc.)- **User account linking** (optional)

- **User account linking** (optional)- **Flexible contact information** (name, email, mobile, bio, title)

- **Flexible contact information** (name, email, mobile, bio, title)- **Primary contact designation**

- **Primary contact designation**- **Active/inactive status**

- **Active/inactive status**

### Current Database Schema

### Current Database Schema```prisma

```prismamodel RoasterPerson {

model RoasterPerson {  id        String   @id @default(cuid())

  id        String   @id @default(cuid())  roasterId String

  roasterId String  roaster   Roaster  @relation(fields: [roasterId], references: [id])

  roaster   Roaster  @relation(fields: [roasterId], references: [id])  

    // Contact information

  // Contact information  name      String

  name      String  title     String?

  title     String?  email     String?

  email     String?  mobile    String?

  mobile    String?  bio       String?

  bio       String?  

    // Link to registered user (optional)

  // Link to registered user (optional)  userId    String?

  userId    String?  user      User?

  user      User?  

    // Multiple roles per person

  // Multiple roles per person  roles     String[] // "owner", "admin", "billing", etc.

  roles     String[] // "owner", "admin", "billing", etc.  

    isActive  Boolean @default(true)

  isActive  Boolean @default(true)  isPrimary Boolean @default(false)

  isPrimary Boolean @default(false)}

}```

```

### API Endpoints

### Current API Endpoints (People/CRM)All existing roaster endpoints now support the new owner contact fields:



Use the People API for managing roaster contacts:- **`POST /api/roasters`**: Include owner fields in request body

- **`PUT /api/roasters/:id`**: Update owner fields

- **`GET /api/people/:id`** - Get a specific person- **`GET /api/roasters`**: Owner fields returned in response (admin auth required for unverified roasters)

- **`GET /api/people/roaster/:roasterId`** - Get all people for a roaster- **`GET /api/roasters/:id`**: Owner fields included in roaster details

- **`POST /api/people`** - Create a new person/contact

- **`PUT /api/people/:id`** - Update a person### Frontend Integration

- **`DELETE /api/people/:id`** - Delete a person- **Admin roaster creation/edit forms**: Include form fields for all owner contact information

- **Roaster detail pages**: Display owner information when available

---- **Form validation**: Validates owner email against existing users if provided



## Historical Implementation (No Longer Valid)### Data Import Support

The `post-roasters.py` script fully supports the new owner contact fields:

### What Changed

```json

**Before (Deprecated):**{

```json  "name": "Example Roastery",

{  "ownerName": "John Doe",

  "name": "Example Roastery",  "ownerBio": "Master roaster with 15 years experience",

  "ownerName": "John Doe",  "ownerMobile": "+1-555-123-4567",

  "ownerEmail": "john@example.com",  // ... other roaster fields

  "ownerBio": "Master roaster",}

  "ownerMobile": "+1-555-1234"```

}

```## Validation Rules



**After (Current):**- **ownerEmail**: Must be an email address of an existing registered user

```json- **ownerName**: Free text, no specific validation

{- **ownerBio**: Free text, suitable for longer descriptions

  "name": "Example Roastery",- **ownerMobile**: Free text, accepts various phone number formats

  "ownerId": "user_123",

  "people": [## Access Control

    {

      "name": "John Doe",- **Public users**: Can view owner information for verified roasters only

      "email": "john@example.com",- **Admin users**: Can view owner information for all roasters (verified and unverified)

      "bio": "Master roaster",- **Admin users**: Can create and edit owner contact information through admin interface

      "mobile": "+1-555-1234",

      "roles": ["owner"],## Audit Logging

      "isPrimary": true

    }All changes to owner contact fields are tracked in the audit logging system:

  ]- Creation of roasters with owner fields

}- Updates to existing owner contact information

```- Field-level change tracking in audit log details



------



See also: See also: [API Documentation](api.md), [Design](design.md), [Requirements](requirements.md)
- [Roasters API](api.md)
- [Design](design.md) 
- [Requirements](requirements.md)
````
