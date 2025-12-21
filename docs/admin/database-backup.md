# Database Backup Configuration

This guide covers setting up automated database backups for **The Beans** application using WebDAV storage.

## Overview

The application includes an admin-only backup feature that:
- 📦 **Creates PostgreSQL dumps** of the entire database
- ☁️ **Uploads to WebDAV server** for secure off-site storage
- 🔐 **Admin-only access** via authenticated API endpoint
- ⏰ **Timestamped backups** with format `the-beans-backup_YYYY-MM-DD_HH-MM-SS.sql`

## Required Environment Variables

Configure these in your `server/.env` file:

```env
# WebDAV Configuration (for database backups)
WEBDAV_URL="https://webdav.example.com"    # WebDAV server URL
WEBDAV_USER="your_webdav_username"         # WebDAV username
WEBDAV_PASS="your_webdav_password"         # WebDAV password
```

## WebDAV Provider Setup

### Option 1: Fastmail (Recommended)

Fastmail includes WebDAV storage with all accounts.

1. **Access WebDAV Settings**:
   - Log into [Fastmail](https://www.fastmail.com)
   - Go to Settings > Files
   - Note your WebDAV URL (usually `https://myfiles.fastmail.com`)

2. **Create App Password** (Recommended):
   - Go to Settings > Privacy & Security > App Passwords
   - Create new app password
   - Name it "The Beans Backup"
   - Copy the generated password

3. **Configure Environment Variables**:
   ```env
   WEBDAV_URL="https://myfiles.fastmail.com"
   WEBDAV_USER="your-email@fastmail.com"
   WEBDAV_PASS="your-app-password"  # From step 2
   ```

4. **Create Backup Directory** (Optional):
   - Use a WebDAV client or Files interface
   - Create a folder named `backups` at the root
   - The API will create this automatically if it doesn't exist

**Fastmail Benefits**:
- Included with all plans (2GB+ storage)
- Reliable and fast
- Strong security
- Easy setup

### Option 2: Box.com

Box provides WebDAV access for business accounts.

1. **Enable WebDAV**:
   - Log into [Box](https://www.box.com)
   - Ensure your account has WebDAV enabled (Business/Enterprise plans)

2. **Get WebDAV URL**:
   - WebDAV URL: `https://dav.box.com/dav`

3. **Configure Environment Variables**:
   ```env
   WEBDAV_URL="https://dav.box.com/dav"
   WEBDAV_USER="your-email@box.com"
   WEBDAV_PASS="your-box-password"
   ```

### Option 3: Nextcloud/ownCloud

Self-hosted or managed Nextcloud/ownCloud instances.

1. **Access WebDAV URL**:
   - Format: `https://your-nextcloud.com/remote.php/dav/files/USERNAME/`
   - Replace `USERNAME` with your username

2. **Create App Password**:
   - Go to Settings > Security
   - Create new app password
   - Name it "The Beans Backup"

3. **Configure Environment Variables**:
   ```env
   WEBDAV_URL="https://your-nextcloud.com/remote.php/dav/files/USERNAME/"
   WEBDAV_USER="your-username"
   WEBDAV_PASS="your-app-password"
   ```

### Option 4: Other WebDAV Providers

Any WebDAV-compatible service will work:
- **pCloud**: `https://webdav.pcloud.com`
- **Koofr**: `https://app.koofr.net/dav`
- **4shared**: `https://webdav.4shared.com`
- **Self-hosted**: Apache/nginx with WebDAV module

## Docker Configuration

After updating `.env` file:

```bash
# Restart server container to load new environment variables
docker-compose restart server

# Verify configuration loaded
docker logs the-beans-server-1 | grep -i webdav
```

## Using the Backup Feature

### Via Admin UI

1. **Log in as admin** at [http://localhost:3000/login](http://localhost:3000/login)

2. **Navigate to Admin Dashboard**: Click "Admin" in navigation bar

3. **Trigger Backup**: Click "Create Database Backup" button

4. **Monitor Progress**: Watch real-time progress:
   - ✅ Create filename
   - ✅ Create database dump
   - ✅ Upload to WebDAV

5. **Verify**: Check your WebDAV storage for the new backup file

### Via API

**Endpoint**: `POST /api/backup/database`

**Authentication**: Requires admin role

**Example Request**:
```bash
curl -X POST http://localhost:5000/api/backup/database \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Success Response** (200):
```json
{
  "success": true,
  "steps": [
    {
      "step": "Create filename",
      "status": "success",
      "message": "Filename: the-beans-backup_2025-12-15_14-30-00.sql"
    },
    {
      "step": "Create database dump",
      "status": "success",
      "message": "Database dumped to /tmp/the-beans-backup_2025-12-15_14-30-00.sql"
    },
    {
      "step": "Upload to WebDAV",
      "status": "success",
      "message": "Uploaded to https://myfiles.fastmail.com/backups/the-beans-backup_2025-12-15_14-30-00.sql"
    }
  ],
  "filename": "the-beans-backup_2025-12-15_14-30-00.sql"
}
```

**Error Response** (500):
```json
{
  "success": false,
  "steps": [
    {
      "step": "Upload to WebDAV",
      "status": "error",
      "message": "WebDAV upload failed: Authentication failed"
    }
  ]
}
```

## Manual Database Backup (Docker)

You can also create backups manually without WebDAV:

```bash
# Create backup file locally
docker exec the-beans-database-1 pg_dump -U beans_user the_beans_db > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore from backup
docker exec -i the-beans-database-1 psql -U beans_user the_beans_db < backup-20251215-143000.sql
```

## Testing WebDAV Configuration

Test your WebDAV connection directly from the server container:

```bash
docker exec the-beans-server-1 node -e "
const { createClient } = require('webdav');
const client = createClient('https://myfiles.fastmail.com', {
  username: 'your-email@fastmail.com',
  password: 'your-app-password'
});
client.getDirectoryContents('/')
  .then(contents => {
    console.log('✅ WebDAV connection successful!');
    console.log('Contents:', contents.map(c => c.filename));
  })
  .catch(err => console.error('❌ WebDAV error:', err.message));
"
```

## Backup Restoration

### Restore Backup to Local Database

1. **Download backup file** from WebDAV storage

2. **Copy to Docker container**:
   ```bash
   docker cp the-beans-backup_2025-12-15_14-30-00.sql the-beans-database-1:/tmp/
   ```

3. **Restore database**:
   ```bash
   # Drop and recreate database (caution: destroys existing data!)
   docker exec the-beans-database-1 psql -U beans_user -c "DROP DATABASE IF EXISTS the_beans_db;"
   docker exec the-beans-database-1 psql -U beans_user -c "CREATE DATABASE the_beans_db;"
   
   # Restore from backup
   docker exec the-beans-database-1 psql -U beans_user the_beans_db < /tmp/the-beans-backup_2025-12-15_14-30-00.sql
   ```

4. **Restart application**:
   ```bash
   docker-compose restart server client
   ```

## Backup Best Practices

### Frequency
- **Development**: Weekly or before major changes
- **Production**: Daily automated backups recommended
- **Before Migrations**: Always create backup before running Prisma migrations

### Retention
- Keep at least 7 daily backups
- Keep 4 weekly backups (monthly)
- Archive important milestone backups permanently

### Security
- Use app-specific passwords, never your main account password
- Store WebDAV credentials securely (never commit to git)
- Encrypt backups if storing sensitive data
- Verify backup integrity periodically

### Automation
Consider setting up a cron job or scheduled task to trigger backups:

```bash
# Linux/Mac crontab example (daily at 2 AM)
0 2 * * * curl -X POST http://localhost:5000/api/backup/database \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Troubleshooting

### Common Issues

#### 1. WebDAV Authentication Failed

**Error**: `WebDAV upload failed: Authentication failed`

**Solutions**:
- Verify `WEBDAV_USER` and `WEBDAV_PASS` are correct
- Use app-specific password instead of main password
- Check WebDAV URL format (include protocol: `https://`)
- Ensure WebDAV is enabled for your account

#### 2. Directory Not Found

**Error**: `WebDAV upload failed: 404 Not Found`

**Solutions**:
- Create `/backups` directory in WebDAV storage
- Check WebDAV URL path is correct
- Some servers need trailing slash: `https://example.com/dav/`

#### 3. Database Dump Failed

**Error**: `Database dump failed: command not found: pg_dump`

**Solutions**:
- Ensure PostgreSQL client tools are installed in server container
- Check `DATABASE_URL` environment variable is set
- Verify database is running: `docker ps | grep database`

#### 4. Permission Denied

**Error**: `Admin access required`

**Solutions**:
- Verify user has `admin` role in database
- Check JWT token is valid and not expired
- Ensure `Authorization` header is properly formatted

#### 5. Insufficient Storage

**Error**: `WebDAV upload failed: Insufficient storage`

**Solutions**:
- Check WebDAV storage quota/limits
- Delete old backups to free space
- Compress backup files before upload (future enhancement)

### Verify Configuration

Check if all required environment variables are set:

```bash
docker exec the-beans-server-1 node -e "
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('WEBDAV_URL:', process.env.WEBDAV_URL ? '✅ Set' : '❌ Missing');
console.log('WEBDAV_USER:', process.env.WEBDAV_USER ? '✅ Set' : '❌ Missing');
console.log('WEBDAV_PASS:', process.env.WEBDAV_PASS ? '✅ Set' : '❌ Missing');
"
```

### Check Logs

View detailed backup logs:

```bash
# View server logs
docker logs the-beans-server-1 --tail 50 --follow

# Search for backup-related logs
docker logs the-beans-server-1 | grep -i backup
```

## Security Considerations

### Environment Variables
- Never commit `.env` file to version control
- Use `.env.example` as template only (without real credentials)
- Rotate passwords periodically

### Access Control
- Only admin users can trigger backups
- Audit log records all backup operations
- JWT tokens required for API access

### Data Protection
- Backups contain full database including user data
- Store WebDAV credentials securely
- Consider encrypting backup files for sensitive data
- Comply with data protection regulations (GDPR, etc.)

## Production Deployment

### Render.com

For production deployments on Render:

1. **Set Environment Variables** in Render dashboard:
   - Go to your service settings
   - Add environment variables:
     - `WEBDAV_URL`
     - `WEBDAV_USER`
     - `WEBDAV_PASS`

2. **Install pg_dump** in production container:
   - Ensure Dockerfile installs PostgreSQL client tools
   - Current Dockerfile already includes `postgresql-client`

3. **Schedule Backups**:
   - Use Render Cron Jobs (separate service)
   - Or use external monitoring service (UptimeRobot, etc.)
   - Call backup API endpoint on schedule

### Monitoring

Set up monitoring to ensure backups are working:
- Check backup file sizes (should be consistent)
- Verify timestamps (ensure recent backups exist)
- Test restoration periodically
- Alert on backup failures

## Related Documentation

- [Admin Features](README.md) - Overview of admin dashboard
- [Email Configuration](../EMAIL_CONFIGURATION.md) - Email setup for notifications
- [Docker Setup](../DOCKER.md) - Docker development environment
- [Deployment](../deployment/README.md) - Production deployment guides
