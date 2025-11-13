# Render Deployment Setup Instructions

## Critical Environment Variables

### Backend Service (`the-beans-api`)

Go to your backend service on Render → Environment tab and add:

```bash
CORS_ORIGIN=https://thebeans.ca,https://the-beans-frontend.onrender.com
NODE_ENV=production
JWT_SECRET=<generate-secure-key>
```

### Frontend Service (`the-beans-frontend`)

Go to your frontend service on Render → Environment tab and add:

```bash
NEXT_PUBLIC_API_URL=https://the-beans-api.onrender.com
NODE_ENV=production
```

## Database Connection

The `DATABASE_URL` should be automatically connected from the database service.

## Deployment Steps

1. **Set Environment Variables**: Add the variables above to each service
2. **Manual Deploy**: Trigger a manual deploy for both services after adding env vars
3. **Check Logs**: Monitor deployment logs for any issues
4. **Test Connection**: Verify the frontend can connect to the backend

## Troubleshooting

### CORS Errors
- Ensure `CORS_ORIGIN` on backend matches the frontend URL exactly
- Check that both services are deployed and running

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` on frontend points to the correct backend URL
- Check that backend service is healthy at `/health` endpoint

### Current Error Fix

The error you're seeing:
```
Access to fetch at 'http://localhost:5000/api/auth/login' from origin 'https://the-beans-frontend.onrender.com' has been blocked by CORS policy
```

Is caused by:
1. Frontend trying to connect to localhost instead of production backend
2. Backend not allowing the frontend domain in CORS policy

**Solution**: Set the environment variables above and redeploy both services.

## Fallback Configuration

The code now includes fallback logic:
- Frontend will auto-detect Render environment and use correct backend URL
- Backend includes production frontend URL in default CORS origins

But explicit environment variables are still recommended for reliability.

### Contact Us Email (SMTP)

To enable the Contact Us form and email notifications on Render, add these environment variables to your backend service:

```
CONTACT_US_EMAIL=your-contact-email@example.com
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```
- Set these in the Render dashboard under your backend service's Environment tab.
- After saving, redeploy or restart the backend service for changes to take effect.

If you use a service like Mailtrap for testing, use their SMTP credentials here.

---