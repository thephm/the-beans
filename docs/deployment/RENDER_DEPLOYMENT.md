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
Render will automatically detect the `render.yaml` file and show two web services:
- **the-beans-api** (Backend Express.js service)
- **the-beans-frontend** (Next.js web service)  

The PostgreSQL database is referenced by `DATABASE_URL` in `render.yaml`, but the `databases:` block is currently commented out. Create a Render PostgreSQL database named `the-beans-db` first, or uncomment/add the database definition before applying the Blueprint.

### 4. Configure Environment Variables
Before deploying, you need to set these environment variables:

#### Required Variables (Set in Render Dashboard)
```
# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration (for notifications and contact form)
CONTACT_US_EMAIL=your_contact_email@example.com
ADMIN_EMAIL=admin@example.com
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password

# Custom Domain Configuration
CLIENT_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

#### Auto-Generated Variables
These are automatically handled by the `render.yaml` when the referenced database exists:
- `JWT_SECRET` (auto-generated)
- `DATABASE_URL` (from database service)
- `NODE_ENV` (set to "production")

### 5. Deploy
Click "Apply" to deploy the web services. Render will:
1. Connect the backend to the existing PostgreSQL database reference
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

#### Temporary request diagnostics

See the [permanent request diagnostics reference](../request-diagnostics.md) for
the complete field specification, investigation guidance, troubleshooting, and removal.

`REQUEST_DIAGNOSTICS` is disabled by default. This is a temporary diagnostic for
unusual traffic and crawler investigation, **not visitor measurement**. It does
not change the existing analytics, authentication, cookies, or browser storage.

1. In Render, open **the-beans-frontend > Environment** (not the API service).
2. Configure `REQUEST_DIAGNOSTIC_SECRET` as a strong, private server-side secret.
   Keep the same value across frontend instances during the investigation.
   Never commit it, prefix it with `NEXT_PUBLIC_`, or add it to `next.config.js`.
3. Set `REQUEST_DIAGNOSTICS=true` and save with Render's rebuild/redeploy option.
   Next.js 14 Edge middleware environment changes should be applied with a rebuild;
   do not assume a running process will pick them up.
4. In the frontend **Logs** tab, filter for `request_diagnostic`.
5. After investigating, set `REQUEST_DIAGNOSTICS=false` and rebuild/redeploy again.
   Restrict access to captured logs and delete exports when no longer needed;
   disabling diagnostics does not delete existing Render logs.

Each relevant request writes one JSON line to application stdout, for example
(illustrative hash and headers):

```json
{"type":"request_diagnostic","timestamp":"2026-10-04T14:24:00.000Z","method":"GET","path":"/discover","status":null,"ipHash":"a1b2c3d4e5f6","userAgent":"GPTBot/1.0","userAgentCategory":"bot-like","cfRay":"example-ray","country":"CA","host":"thebeans.ca"}
```

The server reads `CF-Connecting-IP` first, otherwise the first comma-separated
`X-Forwarded-For` entry. It logs only the first 12 hex characters of
`SHA-256(secret + ":" + UTC YYYY-MM-DD + ":" + clientIP)`. The daily rotating
hash correlates a source within one UTC day, not across days; it is pseudonymous,
not a count of people. If the secret or IP is absent, `ipHash` is `"unavailable"`.
No raw IP, query-string values, referrers, bodies, cookies, authorization headers,
or account fields are included. Neither the hash nor the secret is sent to the browser.
Only the pathname and hostname are recorded, not the full URL.

This uses Next.js **14.2.35 Edge middleware** before response generation, so
`status` is always `null`, including for errors and redirects. Static assets,
source maps, image optimization requests, and the browser manifest are excluded;
API routes (including JSON/file-like endpoints), pages, `robots.txt`, and
`sitemap.xml` are included. User-Agent is recorded as provided; the small category
rule only recognizes the listed crawler names and obvious browser signatures.
It is **not proof of bot or human identity**: browsers and crawlers can spoof it.

Limitations: forwarded/Cloudflare headers are only trustworthy when your ingress
overwrites them; this logger cannot authenticate a crawler or verify the proxy chain.
Shared IPs can merge sources, changing IPs can split them, and truncated hashes
can collide. Requests served or blocked upstream never reach this logger.
Render health checks, prefetches, and App Router data requests may be included:
request totals are not visits. The separate Express API service is not covered.
Paths and User-Agents are untrusted text; avoid putting personal data in URL path
segments and keep log access limited. This diagnostic does not change any existing
Render/proxy logging or its retention policy.

Run the focused checks locally with `cd client` then
`npm run test:request-diagnostics`. For Docker development, configure the variables
in `client/.env.local` and recreate the client container to load changed environment
values; restart it after code changes.

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