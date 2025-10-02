# Render Deployment Fix Instructions

## Issue
The deployed frontend is trying to connect to `localhost:5000` instead of the production backend URL, causing CORS errors.

## Root Cause
The `NEXT_PUBLIC_API_URL` environment variable is not set in the Render dashboard, so the API client is falling back to localhost.

## Solution Steps

### 1. Set Environment Variables in Render Dashboard

#### For the Frontend Service (`the-beans-frontend`):
1. Go to your Render dashboard: https://dashboard.render.com
2. Select the `the-beans-frontend` service
3. Go to "Environment" tab
4. Add/Update these environment variables:
   ```
   NEXT_PUBLIC_API_URL = https://the-beans-api.onrender.com
   NODE_ENV = production
   ```

#### For the Backend Service (`the-beans-api`):
1. Select the `the-beans-api` service
2. Go to "Environment" tab  
3. Add/Update these environment variables:
   ```
   NODE_ENV = production
   CORS_ORIGIN = https://the-beans-frontend.onrender.com
   PORT = 5000
   ```

### 2. Verify Service URLs
Make sure your services are deployed with these exact names:
- Frontend: `https://the-beans-frontend.onrender.com`
- Backend: `https://the-beans-api.onrender.com`

If your URLs are different, update the environment variables accordingly.

### 3. Manual Deployment
After setting environment variables:
1. Go to each service in Render dashboard
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait for both services to redeploy

### 4. Test the Deployment
1. Open `https://the-beans-frontend.onrender.com`
2. Check browser console for debug logs showing the correct API URL
3. Try logging in with: `admin@example.com` / `admin123`

## Debug Information
The API client now includes debug logs. In the browser console, you should see:
```
🔧 API Client Configuration:
  NEXT_PUBLIC_API_URL: https://the-beans-api.onrender.com
  NODE_ENV: production
  ...
🚀 Final API_BASE_URL: https://the-beans-api.onrender.com
```

If you see `http://localhost:5000`, the environment variables are not set correctly.

## Common Issues

### Issue: Environment variables not taking effect
**Solution**: Environment variables are only loaded during build time for `NEXT_PUBLIC_*` vars. Redeploy the frontend after setting them.

### Issue: CORS errors persist
**Solution**: Ensure the backend `CORS_ORIGIN` exactly matches your frontend URL (no trailing slash).

### Issue: Services not communicating
**Solution**: Verify both services are in the same region (oregon) as specified in render.yaml.

## Verification Commands
You can test the API endpoints directly:
```bash
# Test backend health
curl https://the-beans-api.onrender.com/health

# Test CORS preflight
curl -X OPTIONS https://the-beans-api.onrender.com/api/auth/login \
  -H "Origin: https://the-beans-frontend.onrender.com" \
  -H "Access-Control-Request-Method: POST"
```