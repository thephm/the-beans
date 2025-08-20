# Architecture Overview

## System Overview

The Beans is a full-stack web application for discovering coffee roasters. It is built with a modern JavaScript/TypeScript stack, using Docker for local development and deployment. The architecture is modular, with clear separation between frontend, backend, and database layers.

## High-Level Architecture

```
┌────────────┐      ┌────────────┐      ┌────────────┐
│  Browser   │ <--> │  Frontend  │ <--> │  Backend   │ <--> │ Database │
└────────────┘      └────────────┘      └────────────┘
```

- **Frontend**: Next.js (React, TypeScript, Tailwind CSS)
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL

All services are containerized and orchestrated with Docker Compose for local development.

## Frontend

- Located in `client/`
- Built with Next.js 14 (App Router), React 18, TypeScript
- Uses Tailwind CSS for styling and Framer Motion for animations
- Internationalization (i18n) with i18next
- PWA support for mobile installation
- Communicates with backend via REST API
- Key pages: Home, Discover, Roasters, Favorites, Profile, Settings, About

## Backend

- Located in `server/`
- Node.js with Express.js and TypeScript
- RESTful API with endpoints for authentication, user management, roasters, search, reviews, and favorites
- Prisma ORM for database access
- JWT-based authentication
- Swagger UI for API documentation (`/api-docs`)
- Cloudinary integration for image uploads
- Security: Helmet, CORS, rate limiting, input validation

## Database

- PostgreSQL (Dockerized for local dev)
- Prisma schema defines models: User, Roaster, Review, Favorite, Notification, Comment
- Relationships: Users can have favorites, reviews, notifications, etc.

## DevOps & Deployment

- Docker Compose orchestrates three main services: `client` (frontend), `server` (backend), `database` (Postgres)
- Vercel for frontend hosting, Railway/Render for backend, Cloudflare for CDN/domain

## Project Structure

```
the-beans/
├── client/      # Next.js frontend
├── server/      # Node.js backend
├── docs/        # Documentation (docs-as-code)
├── docker-compose.yml
└── ...
```

## Key Flows

### User Authentication
- JWT-based, with registration and login endpoints
- Passwords hashed with bcrypt

### Roaster Discovery
- Search and filter roasters by specialty, location, etc.
- Roaster data includes images, specialties, reviews, and ratings

### Favorites & Reviews
- Users can favorite roasters and leave reviews

### User Profiles & Settings
- Editable profile, notification and privacy settings

## Security
- Helmet for HTTP headers
- CORS configured for frontend
- Rate limiting on API endpoints
- Input validation with express-validator

## API Documentation
- Swagger UI available at `/api-docs` on the backend server

## Internationalization
- All user-facing text is translatable (English/French supported)

## Testing
- Jest and Testing Library for frontend
- Jest and Supertest for backend

---
This architecture enables rapid feature development, strong security, and a great user experience across devices.
