# Coffee App Docker Development Scripts

## Quick Start
```bash
# Start everything (includes PostgreSQL database)
docker-compose up

# Start in background  
docker-compose up -d

# Stop everything
docker-compose down

# Rebuild and start (when you change dependencies)
docker-compose up --build
```

## Database Management

**Backup Database:**
```bash
# Create backup
docker exec the-beans-database-1 pg_dump -U beans_user the_beans_db > backup.sql

# Restore backup
docker exec -i the-beans-database-1 psql -U beans_user the_beans_db < backup.sql
```

**Access Database Directly:**
```bash
# Connect to database shell
docker exec -it the-beans-database-1 psql -U beans_user -d the_beans_db

# Run migrations
docker exec the-beans-server-1 npx prisma migrate dev
```

## Development Workflow

**Important: Container restarts are required for most code changes!** When you edit files in VSCode:

- **Frontend changes**: Require `docker-compose restart client`
- **Backend changes**: Require `docker-compose restart server`  
- **Database changes**: Persist between restarts
- **Hot reload is unreliable** due to Docker volume mounting issues

### After Making Changes:
```bash
# After frontend changes
docker-compose restart client

# After backend changes  
docker-compose restart server

# Restart everything
docker-compose restart
```

## Useful Commands

```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f client
docker-compose logs -f server
docker-compose logs -f database

# Restart a specific service
docker-compose restart client
docker-compose restart server

# Clean slate (rebuild everything)
docker-compose down -v  # This removes database data too!
docker-compose up --build

# Install new packages (run in container)
docker-compose exec client npm install <package>
docker-compose exec server npm install <package>
```

## Production Considerations

**For Production Deployment:**
- Replace the `database` service with external managed PostgreSQL (AWS RDS, etc.)
- Update `DATABASE_URL` to point to production database
- Use proper secrets management instead of hardcoded passwords

**Development vs Production:**
- Development: Database runs in Docker container (this setup)
- Production: Database runs as managed service (recommended)

## Benefits of This Setup

✅ **Automatic file watching** - No more manual restarts  
✅ **Isolated environment** - No more process conflicts  
✅ **Easy database backup** - Standard PostgreSQL tools work
✅ **Consistent across machines** - Works same on Windows/Mac/Linux  
✅ **Easy dependency management** - Each service has its own container  
✅ **Network isolation** - Services communicate via Docker network  
✅ **Volume mounting** - Code changes reflect immediately
✅ **Database persistence** - Data survives container restarts
