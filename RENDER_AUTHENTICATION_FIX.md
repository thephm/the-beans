# Render Authentication Fix - "Invalid Credentials" Error

## Problem

Users are getting "Invalid credentials" error when trying to log in on Render because no users exist in the production database. The seeding process was not included in the deployment.

## Root Cause

The Render build command was missing the database seeding step, so no users (admin or test users) were created in production.

## Solution

### 1. Update Render Configuration (COMPLETED)

The `render.yaml` has been updated to include seeding in the build process:

```yaml
buildCommand: npm install && npx prisma generate && npx prisma migrate deploy && npx prisma db seed && npm run build
```

### 2. Set Environment Variables on Render

Go to your Render dashboard → Backend Service (`the-beans-api`) → Environment tab and add these variables:

#### Required Admin User Variables:
```bash
ADMIN_EMAIL=your-admin@email.com
ADMIN_USERNAME=youradmin
ADMIN_PASSWORD=your-secure-password-here
```

#### Optional Admin User Variables:
```bash
ADMIN_FIRSTNAME=Your
ADMIN_LASTNAME=Name  
ADMIN_LOCATION=Your Location
```

### 3. Redeploy Services

1. **Backend Service**: Go to `the-beans-api` service and click "Manual Deploy"
2. **Monitor Logs**: Watch the deploy logs to ensure seeding completes successfully
3. **Look for**: `🌱 Starting database seeding...` and `✅ Created/ensured admin user` messages

### 4. Test Login

After successful deployment, you can log in with:

#### Default Admin Credentials (if no env vars set):
- **Email**: `admin@example.com`
- **Password**: `admin123`

#### Custom Admin Credentials (if env vars set):
- **Email**: Whatever you set in `ADMIN_EMAIL`
- **Password**: Whatever you set in `ADMIN_PASSWORD`

#### Default Test User:
- **Email**: `coffee@lover.com`
- **Password**: `password123`

## Verification Steps

1. Check that deployment completed without errors
2. Try logging in with admin credentials
3. Check that you can access admin features
4. Try logging in with test user credentials

## Future Deployments

With this fix, every new deployment will:
1. Run database migrations
2. Automatically create/update admin and test users
3. Ensure authentication works immediately

## Additional Notes

- The seeding uses `upsert`, so existing users won't be duplicated
- Admin user settings are only applied during creation, not updates
- Test user (`coffee@lover.com`) is created automatically for development/testing

## If Still Having Issues

1. **Check Environment Variables**: Ensure all required env vars are set
2. **Check Logs**: Look for any seeding errors in deployment logs
3. **Database Connection**: Verify `DATABASE_URL` is properly connected
4. **CORS Settings**: Ensure `CORS_ORIGIN` matches your frontend URL
5. **Manual Seeding**: You can manually run seeding via Render shell if needed

## Manual Seeding (Emergency Fix)

If automatic seeding fails, you can manually seed via Render shell:

```bash
# In Render dashboard, open shell for backend service
npx prisma db seed
```