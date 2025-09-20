# The Beans - AI Coding Agent Instructions

## Project Architecture

**The Beans** is a full-stack coffee roaster discovery app with a Docker-based development environment. The system consists of three main services orchestrated by Docker Compose:

- **Frontend**: Next.js 14 (App Router) with TypeScript at `client/`
- **Backend**: Express.js API with Prisma ORM at `server/`  
- **Database**: PostgreSQL (containerized for local development)

## Critical Development Workflow

### Docker-First Development
This project **requires Docker container restarts** for most code changes to take effect. Hot reload is unreliable due to Docker volume mounting:

```bash
# After making frontend changes
docker-compose restart client

# After making backend changes  
docker-compose restart server

# Start/rebuild everything
docker-compose up --build
```

**Key Point**: Never assume hot reload will work. Always restart containers after code changes.

## Essential Commands & Database Access

```bash
# Database shell access
docker exec -it the-beans-database-1 psql -U beans_user -d the_beans_db

# Check admin users  
docker exec -it the-beans-database-1 psql -U beans_user -d the_beans_db -c "SELECT email, username, role FROM users WHERE role = 'admin';"

# Default admin credentials
# Email: admin@example.com, Password: admin123

# Generate Prisma client after schema changes
docker-compose exec server npx prisma generate

# Database migrations
docker-compose exec server npx prisma migrate dev
```

## API Patterns & Authentication

### Route Structure in `server/src/routes/`
- **Authentication middleware**: `optionalAuth` (public routes), `requireAuth` (protected routes)
- **Admin-only routes**: Check `user.role === 'admin'` in middleware
- **Validation**: express-validator for input sanitization
- **Error handling**: Consistent JSON error responses

### Frontend API Client (`client/src/lib/api.ts`)
- Centralized API client with automatic JWT token handling
- Base URL: `http://localhost:5000` (configurable via NEXT_PUBLIC_API_URL)
- Token storage in localStorage with automatic header injection

## Data Model Relationships (Prisma)

Key entities in `server/prisma/schema.prisma`:
- **User**: Has role ('user' | 'admin'), owns roasters, creates reviews/favorites
- **Roaster**: Location-based, has reviews, can be favorited, owned by user
- **Review/Favorite/Notification**: Relationship tables linking users to roasters

## Internationalization (i18n)

### Translation Structure
- **Location**: `client/public/locales/{en,fr}/common.json`
- **Usage**: `{t('key.path', 'Fallback Text')}` in components
- **Context**: Available via `useTranslation()` hook

### Adding New Translations
1. Add keys to both `en/common.json` and `fr/common.json`
2. Use nested object notation: `"admin": { "users": { "title": "Users" } }`
3. Restart client container to load new keys

## Component Architecture

### Page Structure (App Router)
- **Layout**: `client/src/app/layout.tsx` with providers
- **Pages**: Each route in `app/` directory with `page.tsx`
- **Admin pages**: Protected by auth check, require restart after changes

### Key Context Providers
- **AuthContext**: User authentication state, login/logout methods
- **LanguageContext**: i18n language switching (en/fr)

## Admin Role & Permissions

### Admin Access Patterns
```typescript
// Check admin role in components
{user?.role === 'admin' && (
  <AdminComponent />
)}

// Backend admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

## Common Gotchas

1. **Container Restarts**: Code changes require `docker-compose restart client/server`
2. **Database Queries**: Use Prisma client, not raw SQL
3. **TypeScript Sync**: Update both `client/src/types/index.ts` and Prisma schema
4. **Translation Keys**: Must exist in both English and French files
5. **Terminal Directory**: Commands may start in wrong directory - use `cd` explicitly
6. **Admin Navigation**: Admin dropdown only shows when logged in as admin user

## Environment & Deployment

### Local Development URLs
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000` 
- API Docs: `http://localhost:5000/api-docs` (Swagger)

### Database Configuration
- PostgreSQL credentials in `docker-compose.yml`
- Connection: `postgresql://beans_user:2w3E4r%T@database:5432/the_beans_db`
- Prisma handles migrations and seeding

## Performance Notes

The project has experienced file watching issues in WSL/Docker environments. The current Docker setup is the most reliable development environment, but requires manual container restarts for code changes to take effect consistently.