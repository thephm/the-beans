
Technical design and architecture for roasters.

# Roasters Design

## Architecture Overview
The roasters feature is built with a full-stack architecture:

- **Backend:** Node.js/Express API (`server/src/routes/roasters.ts`) with Prisma ORM for database access.
- **Database:** PostgreSQL, modeled via Prisma (`server/prisma/schema.prisma`).
- **Frontend:** Next.js React app (`client/src/app/roasters/`), consuming the API and providing a modern UI.

## Backend Details
- **API Endpoints:** RESTful endpoints for listing, filtering, creating, and viewing roasters.
- **Authentication:** JWT-based, with optional and required auth middleware for different routes.
- **Filtering & Sorting:** Query parameters for search, city, state, specialty, location, and sort order.
- **Pagination:** Standard page/limit pattern.
- **Location Search:** Haversine formula for distance filtering.
- **Swagger Annotations:** For API documentation.

## Database Schema
- **Roaster Model:** Includes fields for name, description, contact info, location, images, hours, specialties, verification, featured status, rating, review count, and owner contact fields (ownerName, ownerEmail, ownerBio, ownerMobile).
- **Relations:** Roaster belongs to a User (owner), has many Beans, Reviews, and Favorites.
- **Owner Contact Fields:** Direct roaster fields that store owner contact information independently of the User relationship, allowing for flexible owner data management.

## Frontend Integration
- **Roaster List Page:** Fetches and displays roasters with filters, sorting, and favorite toggling.
- **Roaster Detail Page:** Shows full roaster info, specialties, hours, contact, and owner.
- **Favorites:** Managed in localStorage for quick access.
- **Internationalization:** All UI and specialty names are translatable.

## Extensibility
- Designed for easy addition of new fields, filters, and integrations (e.g., map, advanced reviews).

---

See also: [API](api.md), [Overview](overview.md), [Requirements](requirements.md), [Test Cases](test.md)
