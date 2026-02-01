# Architecture Overview

## System Overview

The Beans is a modern full-stack web application for discovering specialty coffee roasters. Built with a **Docker-first development approach**, it features a clean separation between frontend, backend, and database layers using industry-standard technologies.

## High-Level Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browser   │◄──►│  Frontend   │◄──►│   Backend   │◄──►│  Database   │
│             │    │             │    │             │    │             │
│ React/Next  │    │ Next.js 14  │    │ Express.js  │    │ PostgreSQL  │
│ TypeScript  │    │ TypeScript  │    │ Prisma ORM  │    │ Dockerized  │
│ Tailwind    │    │ App Router  │    │ JWT Auth    │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Technology Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM
- **Database**: PostgreSQL (containerized for development)
- **DevOps**: Docker Compose for orchestration
- **Authentication**: JWT-based with bcrypt password hashing

All services are **containerized and orchestrated** with Docker Compose for consistent local development.

## Frontend Architecture (`client/`)

### Core Technologies
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict typing
- **Styling**: Tailwind CSS + custom purple theme
- **State Management**: React Context (AuthContext, LanguageContext)
- **Internationalization**: i18next (English/French support)
- **API Client**: Centralized client with JWT token management

### Key Features
- **Responsive Design**: Mobile-first approach with Tailwind
- **PWA Support**: App manifest for mobile installation
- **Image Optimization**: Next.js Image component + Cloudinary integration
- **SEO Optimized**: Meta tags and structured data
- **Performance**: Code splitting and lazy loading

### Page Structure
```
src/app/                    # App Router pages
├── page.tsx               # Home page
├── layout.tsx             # Root layout with providers
├── discover/              # Roaster discovery
├── roasters/              # Individual roaster pages
├── favourites/            # User favourites
├── profile/               # User profile management
├── settings/              # User preferences
├── admin/                 # Admin dashboard (protected)
├── login/ & signup/       # Authentication flows
└── about/                 # About page
```

## Backend Architecture (`server/`)

### Core Technologies
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with strict typing
- **Database**: Prisma ORM for type-safe database access
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: Cloudinary integration for image uploads
- **Documentation**: Swagger UI at `/api-docs`

### API Design Patterns
- **RESTful Architecture**: Standard HTTP methods and status codes
- **Middleware Chain**: Authentication, validation, error handling
- **Input Validation**: express-validator for request sanitization
- **Error Handling**: Consistent JSON error responses
- **Rate Limiting**: Protection against abuse

### Route Structure
```
src/routes/
├── auth.ts               # Authentication endpoints
├── users.ts              # User management (admin only)
├── roasters.ts           # Roaster CRUD operations
├── search.ts             # Search and filtering
├── reviews.ts            # Review system
├── favourites.ts         # User favourites
├── notifications.ts      # User notifications
└── uploads.ts            # File upload handling
```

### Security Features
- **Helmet**: HTTP security headers
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: Per-endpoint request throttling
- **Input Sanitization**: XSS and injection prevention
- **JWT Validation**: Token-based authentication middleware

## Database Architecture

### Database Technology
- **Engine**: PostgreSQL (production-ready, ACID compliant)
- **Development**: Dockerized container for consistency
- **ORM**: Prisma for type-safe database operations
- **Migrations**: Automated schema versioning and deployment

### Data Model Relationships
```
User (1:many)
├── Roaster (owns/creates/updates)
├── Review (creates/updates)
├── Favourite (has)
├── Notification (receives)
└── AuditLog (performs actions)

Roaster (1:many)
├── Review (receives)
├── Favourite (in)
├── Comment (has)
├── CreatedBy (User audit)
└── UpdatedBy (User audit)

AuditLog (many:1)
└── User (performed by)
```

### Key Models (`prisma/schema.prisma`)
- **User**: Authentication, profiles, role-based access
- **Roaster**: Coffee shop data, location, specialties, founded year, social media links (Instagram, TikTok, Facebook, LinkedIn, YouTube, Threads, Pinterest, BlueSky, X), owner contact fields (ownerName, ownerEmail, ownerBio, ownerMobile) (with audit tracking)
- **Review**: User ratings and feedback (with audit tracking)
- **Bean**: Coffee product information (with audit tracking)
- **Favourite**: User's saved roasters
- **Notification**: System and user notifications
- **Comment**: Community discussions
- **AuditLog**: Comprehensive activity tracking with geolocation

## DevOps & Deployment

### Local Development (Docker)
```yaml
docker-compose.yml orchestrates:
├── client (frontend)     # Next.js on port 3000
├── server (backend)      # Express.js on port 5000  
└── database (postgres)   # PostgreSQL on port 5432
```

### Critical Development Workflow
**Container restarts required** for code changes:
```bash
# After frontend changes
docker-compose restart client

# After backend changes
docker-compose restart server
```

### Production Deployment
- **Frontend**: Docker-based containerization
- **Backend**: Railway or Render (containerized deployment)
- **Database**: Managed PostgreSQL (Railway/Render)
- **CDN**: Cloudflare for static assets and domain
- **File Storage**: Cloudinary for user-uploaded images

### Environment Configuration
```
Development:  Docker Compose (.env files)
Staging:      Railway/Render (environment variables)
Production:   Railway/Render + Docker (secure env vars)
```

## Audit Logging System

### Overview
Comprehensive audit trail system that tracks all system changes with detailed metadata for compliance, security, and debugging.

### Features
- **Who**: User identification with profile links
- **What**: Entity-level tracking (roasters, reviews, beans, users)
- **When**: Precise timestamps (YYYY-MM-DD HH:MM:SS)
- **Where**: IP geolocation (city, country) via ipapi.co
- **How**: Field-level change detection with before/after values

### Architecture Components

#### Backend Infrastructure
```
AuditService (auditService.ts)
├── IP Geolocation (with caching)
├── Change Detection (field-level)
├── Async Logging (non-blocking)
└── Error Isolation (audit failures don't break operations)

AuditMiddleware (auditMiddleware.ts)  
├── Pre-operation capture (old values)
├── Post-operation logging (new values)
├── Route-level integration
└── Flexible entity support

Admin API Routes (/api/admin/audit-logs)
├── Paginated log retrieval
├── Advanced filtering
├── Statistics dashboard
└── Individual log details
```

#### Database Schema
```sql
AuditLog {
  action:      CREATE | UPDATE | DELETE
  entityType:  roaster | review | bean | user
  entityId:    UUID of affected record
  entityName:  Display name for UI
  changes:     JSON field-level diff {field: {old, new}}
  ipAddress:   Client IP (with proxy detection)
  userAgent:   Browser/client information  
  city:        Geolocation city
  country:     Geolocation country
  userId:      User who performed action
  createdAt:   Precise timestamp
}

// Enhanced entity models with audit tracking
Roaster/Review/Bean {
  createdById: UUID  // Who created
  updatedById: UUID  // Who last updated
  // ... existing fields
}
```

#### Frontend Admin Interface
- **Dashboard**: Activity statistics and trends
- **Filtering**: By user, action, entity, date range
- **Change Viewer**: Side-by-side old/new value comparison
- **Navigation**: Integrated into admin dropdown menu
- **Internationalization**: English/French translations

### Security & Performance
- **Access Control**: Admin-only access to audit logs
- **IP Detection**: Handles proxies and load balancers
- **Geolocation Caching**: Reduces API calls for repeated IPs  
- **Async Processing**: Audit logging never blocks main operations
- **Database Indexing**: Optimized queries on common filters
- **Error Handling**: Robust error isolation and logging

## Detailed Project Structure

```
the-beans/
├── client/                      # Next.js 14 Frontend
│   ├── src/
│   │   ├── app/                 # App Router (pages & layouts)
│   │   ├── components/          # Reusable React components
│   │   ├── contexts/            # React Context providers
│   │   │   ├── AuthContext.tsx  # User authentication state
│   │   │   └── LanguageContext.tsx # i18n language switching
│   │   ├── lib/
│   │   │   ├── api.ts          # Centralized API client
│   │   │   └── utils.ts        # Helper functions
│   │   └── types/              # TypeScript definitions
│   ├── public/
│   │   ├── locales/            # i18n translation files
│   │   │   ├── en/common.json  # English translations
│   │   │   └── fr/common.json  # French translations
│   │   └── images/             # Static assets
│   └── Dockerfile              # Frontend container
│
├── server/                    # Express.js Backend
│   ├── src/
│   │   ├── routes/            # RESTful API endpoints
│   │   │   └── auditLogs.ts   # Admin audit log API
│   │   ├── middleware/        # Auth, validation, error handling
│   │   │   └── auditMiddleware.ts # Audit logging middleware
│   │   └── lib/               # Server utilities
│   │       └── auditService.ts # Audit logging service
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema definition
│   │   ├── migrations/       # Database version control
│   │   └── seed.ts           # Development data seeding
│   ├── uploads/              # Temporary file storage
│   └── Dockerfile            # Backend container
│
├── docs/                     # Documentation (docs-as-code)
│   ├── README.md             # Documentation index
│   ├── architecture.md       # This file
│   ├── glossary.md           # Terms and definitions
│   └── [features]/           # Feature-specific docs
│
├── docker-compose.yml        # Multi-service orchestration
├── README.md                 # Main project documentation
├── SETUP.md                  # Detailed setup instructions
└── Various configs          # ESLint, TypeScript, etc.
```

## Key Application Flows

### User Authentication Flow
1. **Registration**: Email/password → bcrypt hashing → JWT token
2. **Login**: Credentials validation → JWT token generation
3. **Token Management**: Auto-refresh, localStorage persistence
4. **Role-Based Access**: User vs Admin permissions

### Roaster Discovery Flow
1. **Search Interface**: Location, specialty, name filters
2. **API Query**: Backend search with pagination
3. **Results Display**: Card layout with images, ratings
4. **Detail View**: Full roaster profile with reviews

### User Interaction Flow
1. **Favourites**: Add/remove with optimistic UI updates
2. **Reviews**: Create, edit, delete with validation
3. **Notifications**: Real-time updates for user activity
4. **Admin Actions**: User management, content moderation

### Image Upload Flow
1. **Frontend**: File selection with preview
2. **Backend**: Multer handling + Cloudinary upload
3. **Database**: Store Cloudinary URL in roaster record
4. **Display**: Optimized images via Next.js Image component

## Security Architecture

### Backend Security
- **Helmet**: HTTP security headers (CSP, XSS protection)
- **CORS**: Configured for frontend domain whitelist
- **Rate Limiting**: Per-endpoint request throttling
- **Input Validation**: express-validator sanitization
- **Password Security**: bcrypt hashing with salt rounds
- **JWT Security**: Signed tokens with expiration

### Frontend Security
- **XSS Prevention**: React's built-in escaping
- **CSRF Protection**: SameSite cookies
- **Content Security Policy**: Strict resource loading
- **Secure API Calls**: HTTPS-only in production

## API Documentation

### Interactive Documentation
- **Swagger UI**: Available at `http://localhost:5000/api-docs`
- **Auto-Generated**: From route definitions and schemas
- **Testing Interface**: Execute API calls directly from browser

### API Standards
- **RESTful Design**: Standard HTTP methods and status codes
- **Consistent Responses**: Uniform JSON structure
- **Error Handling**: Detailed error messages and codes

## Internationalization (i18n)

### Translation System
- **Framework**: i18next with React integration
- **Languages**: English (default) + French
- **File Structure**: JSON files in `client/public/locales/`
- **Usage Pattern**: `{t('key.path', 'Fallback Text')}`

### Implementation Details
```typescript
// Context usage
const { t } = useTranslation();

// Component usage
<h1>{t('admin.users.title', 'User Management')}</h1>
```

## Testing Strategy

### Frontend Testing
- **Unit Tests**: Jest + React Testing Library
- **Component Tests**: Isolated component behavior
- **Integration Tests**: User interaction flows
- **E2E Tests**: Playwright for critical paths

### Backend Testing
- **Unit Tests**: Jest for individual functions
- **Integration Tests**: Supertest for API endpoints
- **Database Tests**: In-memory test database
- **Security Tests**: Authentication and authorization

### Development Testing
- **Manual Testing**: Admin dashboard functionality
- **Docker Testing**: Container orchestration validation
- **Performance Testing**: Load testing with realistic data

---

## Architecture Benefits

This architecture provides:
- **Rapid Development**: Docker-first workflow with hot reload
- **Strong Security**: Multi-layered security approach
- **Great UX**: Responsive design and performance optimization
- **Global Ready**: Full internationalization support
- **Maintainable**: Clear separation of concerns and documentation
- **Scalable**: Modular design supporting horizontal scaling
