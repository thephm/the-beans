# Render.com Deployment Guide for The Beans

This guide will walk you through deploying The Beans coffee roaster discovery app on Render.com using the included `render.yaml` configuration.

## Prerequisites

- GitHub account with The Beans repository
- Render.com account (free tier available)
- Cloudinary account for image storage
- Environment variables ready

## Quick Deployment (Blueprint Method)

### 1. Prepare Your Repository
Ensure your repository includes the `render.yaml` file in the root directory.

### 2. Connect to Render
1. Visit [render.com](https://render.com) and sign up/log in
2. Click "New" → "Blueprint"
3. Connect your GitHub account if not already connected
4. Select your `the-beans` repository

### 3. Review Services
Render will automatically detect the `render.yaml` file and show three services:
- **the-beans-api** (Backend Express.js service)
- **the-beans-frontend** (Next.js static site)  
- **the-beans-db** (PostgreSQL database)

### 4. Configure Environment Variables
Before deploying, you need to set these environment variables:

#### Required Variables (Set in Render Dashboard)
```
# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Custom Domain Configuration
CORS_ORIGIN=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

#### Auto-Generated Variables
These are automatically handled by the `render.yaml`:
- `JWT_SECRET` (auto-generated)
- `DATABASE_URL` (from database service)
- `NODE_ENV` (set to "production")

### 5. Deploy
Click "Apply" to create and deploy all services. Render will:
1. Create the PostgreSQL database
2. Build and deploy the backend API
3. Build and deploy the frontend

## Manual Deployment (Individual Services)

If you prefer to create services manually:

### 1. Create Database
- Service Type: PostgreSQL
- Name: `the-beans-db`
- Database Name: `the_beans_production`
- Plan: Starter (free tier available)

### 2. Create Backend Service
- Service Type: Web Service
- Runtime: Node.js
- Build Command: `cd server && npm install && npx prisma generate && npm run build`
- Start Command: `cd server && npm run start`
- Environment Variables: (same as above, plus `DATABASE_URL` from database)

### 3. Create Frontend Service
- Service Type: Web Service  
- Runtime: Node.js
- Build Command: `cd client && npm install && npm run build`
- Start Command: `cd client && npm start`
- Environment Variables: `NEXT_PUBLIC_API_URL` (backend service URL)

## Post-Deployment Setup

### 1. Custom Domain Configuration

#### Setting Up Your Custom Domain
1. **Add Domain to Services**: In Render dashboard, go to each service settings
2. **Frontend Service**: Add your main domain (e.g., `yourdomain.com`, `www.yourdomain.com`)
3. **Backend Service**: Add your API subdomain (e.g., `api.yourdomain.com`)
4. **DNS Configuration**: Point your domain to Render's servers:
   ```
   CNAME www yourdomain.onrender.com
   CNAME api yourdomain-api.onrender.com
   ```

#### Environment Variables for Custom Domain
After adding domains, update these environment variables:
- **Backend Service**: `CORS_ORIGIN=https://yourdomain.com`
- **Frontend Service**: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`

### 2. Database Migration
The build process automatically runs Prisma migrations, but you can also run them manually via Render Shell:
```bash
npx prisma migrate deploy
npx prisma generate
```

### 3. Admin User Setup
Connect to your database and create an admin user, or use the seeding process if configured.

### 3. Update URLs
Update these in your Render environment variables:
- `CORS_ORIGIN` in backend service (frontend URL)
- `NEXT_PUBLIC_API_URL` in frontend service (backend URL)

## Service URLs
After deployment, your services will be available at:
- Frontend: `https://the-beans-frontend.onrender.com`
- Backend API: `https://the-beans-api.onrender.com`
- Database: Internal connection string provided by Render

## Monitoring & Maintenance

### Health Checks
The backend includes a health check endpoint at `/health` that Render uses for monitoring.

### Logs
View logs for each service in the Render dashboard under the service's "Logs" tab.

### Auto-Deploy
Services are configured to auto-deploy on pushes to the `main` branch.

### Scaling
- Free tier: Services sleep after 15 minutes of inactivity
- Paid tiers: Always-on with auto-scaling options

## Troubleshooting

### Common Issues
1. **Build Failures**: Check that `package.json` scripts exist for `build` and `start`
2. **Database Connection**: Ensure `DATABASE_URL` environment variable is set correctly
3. **CORS Errors**: Verify `CORS_ORIGIN` matches your frontend URL
4. **Image Upload Issues**: Check Cloudinary environment variables

### Environment Variable Checklist
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY` 
- [ ] `CLOUDINARY_API_SECRET`
- [ ] `CORS_ORIGIN` (your custom frontend domain)
- [ ] `NEXT_PUBLIC_API_URL` (your custom API domain)
- [ ] `DATABASE_URL` (auto-set from database service)
- [ ] `JWT_SECRET` (auto-generated)

### Support Resources
- [Render Documentation](https://render.com/docs)
- [Render Community Forum](https://community.render.com)
- [The Beans GitHub Issues](https://github.com/thephm/the-beans/issues)