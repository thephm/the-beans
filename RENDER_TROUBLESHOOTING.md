# Render.com Deployment Troubleshooting Guide

## Common Blueprint Deployment Failures

### 1. Build Command Issues
**Problem**: Build fails with "cannot find module" or directory errors
**Solution**: Use `rootDir` property instead of `cd` commands in build scripts

✅ **Correct Configuration**:
```yaml
- type: web
  name: the-beans-api
  rootDir: server
  buildCommand: npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

❌ **Incorrect Configuration**:
```yaml
buildCommand: cd server && npm install && npm run build
```

### 2. Database Dependency Order
**Problem**: Web services fail to connect to database during build
**Solution**: Define database before web services in `render.yaml`

✅ **Correct Order**:
```yaml
# Database first
databases:
  - name: the-beans-db
    # ...config

# Web services after
services:
  - type: web
    # ...config
```

### 3. Node.js Version Conflicts
**Problem**: Build fails with Node.js version incompatibility
**Solution**: Specify exact Node.js version in `render.yaml`

```yaml
- type: web
  runtime: node
  nodeVersion: 18  # Specify exact version
```

### 4. Prisma Migration Issues
**Problem**: Database schema not created during deployment
**Solution**: Include `prisma migrate deploy` in build command

```yaml
buildCommand: npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

### 5. Environment Variables
**Problem**: Services fail to start due to missing environment variables
**Solution**: Set required environment variables in Render dashboard

**Required Variables**:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CORS_ORIGIN` (your frontend URL)
- `NEXT_PUBLIC_API_URL` (your backend URL)

### 6. Frontend Routing Issues
**Problem**: SPA routing doesn't work (404 on direct URL access)
**Solution**: Configure proper rewrite rules

```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html  # Not just "/"
```

## Step-by-Step Debugging

### 1. Check Build Logs
1. Go to Render Dashboard
2. Click on failed service
3. Check "Logs" tab for specific error messages

### 2. Common Error Messages

**"Module not found"**
- Check `rootDir` is set correctly
- Verify `package.json` exists in the specified directory

**"Database connection failed"**
- Ensure database service is running
- Check `DATABASE_URL` environment variable is set automatically

**"Permission denied"**
- Remove any `sudo` commands from build scripts
- Use npm instead of yarn if there are permission issues

**"Port already in use"**
- Don't specify PORT in environment variables for frontend
- Backend should use PORT from environment (Render sets this automatically)

### 3. Test Locally First
Before deploying to Render, test the exact build commands locally:

```bash
# Backend
cd server
npm install
npx prisma generate
npx prisma migrate deploy  # This will fail locally but should work on Render
npm run build
npm run start

# Frontend  
cd client
npm install
npm run build
npm start
```

## Deployment Checklist

Before creating Blueprint:

- [ ] `render.yaml` is in project root
- [ ] Database is defined before web services
- [ ] `rootDir` is specified for each service
- [ ] Node.js version is specified
- [ ] Build commands don't use `cd`
- [ ] Prisma schema is valid (generator/datasource before models)
- [ ] All required dependencies are in `package.json`

After Blueprint creation:

- [ ] Set Cloudinary environment variables
- [ ] Set custom domain environment variables (if using)
- [ ] Check build logs for any warnings
- [ ] Test health check endpoints
- [ ] Verify database migrations ran successfully

## Getting Help

If deployment still fails:

1. **Check Render Status**: https://status.render.com
2. **Review Build Logs**: Look for specific error messages
3. **Test Locally**: Ensure build commands work in local environment
4. **Simplify Configuration**: Try deploying one service at a time
5. **Contact Support**: Include build logs and `render.yaml` in support request

## Performance Tips

- Use same region for all services (database, frontend, backend)
- Enable auto-deploy only after testing manually first
- Consider using `starter` plan initially, upgrade for production
- Monitor build times and optimize dependencies if needed