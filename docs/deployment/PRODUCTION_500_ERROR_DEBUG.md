# Production 500 Error - Roasters and People Endpoints

## Error Details
**Error Message:** `Failed to load resource: the server responded with a status of 500 ()`  
**Component:** `PeopleTable.tsx`  
**Endpoints Affected:**
- `GET /api/roasters?limit=100`
- `GET /api/people?page=1&limit=100`

## Root Cause Analysis

The error occurs when the admin PeopleTable component tries to fetch roasters and people data. Both endpoints require:
1. Valid JWT authentication token
2. Admin role permission
3. Active database connection
4. Prisma client properly generated

## Most Likely Causes

### 1. **Prisma Client Not Generated in Production** ⚠️
The Prisma client must be generated after each deployment:

```bash
# In production environment
cd server
npx prisma generate
```

**Check deployment scripts:**
- Ensure `postinstall` or build script includes `prisma generate`
- Verify `package.json` has the correct build script

### 2. **Missing or Invalid DATABASE_URL** ⚠️
The database connection string might be missing or malformed:

```bash
# Check environment variable in production
echo $DATABASE_URL

# Expected format:
postgresql://username:password@host:port/database_name
```

**On Render.com:**
- Go to Dashboard → Your Service → Environment
- Verify `DATABASE_URL` is set correctly
- Ensure special characters in password are URL-encoded

### 3. **Database Connection Timeout**
PostgreSQL might be unreachable or have connection limits reached:

```bash
# Test database connectivity
docker exec -it <container> psql $DATABASE_URL -c "SELECT 1"
```

### 4. **Complex Query Failing on Specific Data**
The roasters endpoint fetches deeply nested relations:
- `owner` (User)
- `people` (RoasterPerson with User)
- `roasterImages`
- `roasterSpecialties` (with Specialty and Translations)
- `_count` for reviews and favourites

**Potential issues:**
- A roaster with malformed JSON in `hours` field
- Missing translations for a specialty
- Orphaned relationships (deleted users still referenced)

### 5. **Memory/Resource Limits**
Fetching 100 roasters with all relations might exceed memory limits:

```bash
# Check container logs for OOM errors
docker logs <container-name> --tail 100
```

## Diagnostic Steps

### Step 1: Check Health Endpoint
I've enhanced the `/health` endpoint to test database connectivity:

```bash
curl https://your-api.onrender.com/health
```

**Expected Response (Healthy):**
```json
{
  "status": "OK",
  "timestamp": "2026-01-02T...",
  "uptime": 12345,
  "database": "connected"
}
```

**Error Response:**
```json
{
  "status": "ERROR",
  "database": "disconnected",
  "error": "Connection refused"
}
```

### Step 2: Check Production Logs
Enhanced error logging now includes:
- Full error message
- Stack trace
- Request context

```bash
# View logs on Render
# Dashboard → Your Service → Logs

# Look for:
# - "Get roasters error:" or "Get all people error:"
# - "Prisma Client" errors
# - Connection timeout errors
```

### Step 3: Test Endpoints Individually
Test each endpoint separately with admin authentication:

```bash
# Get admin token first
curl -X POST https://your-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Test roasters endpoint
curl https://your-api.onrender.com/api/roasters?limit=10 \
  -H "Authorization: Bearer <token>"

# Test people endpoint
curl https://your-api.onrender.com/api/people?page=1&limit=10 \
  -H "Authorization: Bearer <token>"
```

### Step 4: Check Prisma Client
Verify Prisma client is generated:

```bash
# SSH into production container or check build logs
ls -la node_modules/.prisma/client

# Should show:
# - index.js
# - libquery_engine-<platform>.so.node
```

## Quick Fixes

### Fix 1: Regenerate Prisma Client
Add to `package.json` in server directory:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && tsc"
  }
}
```

### Fix 2: Reduce Query Complexity Temporarily
Modify `PeopleTable.tsx` to fetch without roasters first:

```typescript
// Comment out roasters fetch temporarily
// const roastersData = await apiClient.getRoasters({ limit: 100 });
// setRoasters([]);

// Or reduce limit
const roastersData = await apiClient.getRoasters({ limit: 10 });
```

### Fix 3: Add Connection Retry Logic
Add to `server/src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Test connection on startup
prisma.$connect()
  .then(() => console.log('✅ Database connected successfully'))
  .catch((error) => console.error('❌ Database connection failed:', error));

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Fix 4: Increase Connection Pool
Update `DATABASE_URL` with connection pool parameters:

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=10"
```

## Deployment Checklist

Before deploying, verify:

- [ ] `DATABASE_URL` is set in production environment
- [ ] `JWT_SECRET` is set and matches frontend expectations
- [ ] `prisma generate` runs during build/postinstall
- [ ] Database is accessible from production server
- [ ] Admin user exists in production database
- [ ] Container has sufficient memory (minimum 512MB recommended)
- [ ] Build logs show successful Prisma client generation

## Environment Variables Checklist

Required in production:

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=<secure-random-string>
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://your-frontend.com

# Optional but recommended:
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## Testing After Fix

1. **Deploy changes:**
   ```bash
   git add .
   git commit -m "Fix: Enhanced error logging for production debugging"
   git push
   ```

2. **Wait for deployment to complete**

3. **Test health endpoint:**
   ```bash
   curl https://your-api.onrender.com/health
   ```

4. **Check production logs for detailed error messages**

5. **Test admin login and people table access**

## Common Error Messages

### "Prisma Client is unable to run..."
**Solution:** Run `nprisma generate` or add to postinstall script

### "Can't reach database server"
**Solution:** Check `DATABASE_URL`, verify database is running, check firewall rules

### "Invalid `prisma.$queryRaw()` invocation"
**Solution:** Check for malformed data in database (JSON fields, null values)

### "JWT malformed" or "Invalid token"
**Solution:** Verify `JWT_SECRET` matches between environments

## Next Steps

1. Deploy the enhanced error logging
2. Check production logs for specific error details
3. Run through diagnostic steps above
4. Report findings with specific error messages for further assistance

## Contact & Support

If issue persists after trying all fixes:
- Provide production logs from time of error
- Include response from `/health` endpoint
- Share any specific error messages from console
