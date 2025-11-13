# The Beans - Complete Setup Guide

Welcome to **The Beans** - a modern coffee roaster discovery platform! This comprehensive guide will help you get the entire development environment up and running.

## 🎯 Prerequisites

### Required Software
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (recommended)
- [Git](https://git-scm.com/downloads)

### Optional (for local development without Docker)
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/download/)

## 🐳 Recommended Setup (Docker - Preferred)

**⚠️ Critical**: Docker provides the most reliable development environment. Container restarts are **required** for code changes to take effect.

### 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/thephm/the-beans.git
   cd the-beans
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

3. **Access the applications**
   - 🌐 **Frontend**: [http://localhost:3000](http://localhost:3000)
   - 🔧 **Backend API**: [http://localhost:5000](http://localhost:5000)  
   - 📚 **API Documentation**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

### 🔄 Development Workflow

**Essential commands for Docker development:**

```bash
# After making frontend changes
docker-compose restart client

# After making backend changes
docker-compose restart server

# Rebuild everything if needed
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f client    # Frontend logs
docker-compose logs -f server    # Backend logs
```

### 🗃️ Database Management

```bash
# Connect to PostgreSQL shell
docker exec -it the-beans-database-1 psql -U beans_user -d the_beans_db

# Run database migrations
docker-compose exec server npx prisma migrate dev

# Generate Prisma client
docker-compose exec server npx prisma generate

# Reset database (careful!)
docker-compose exec server npx prisma migrate reset

# Check admin users
docker exec -it the-beans-database-1 psql -U beans_user -d the_beans_db -c "SELECT email, username, role FROM users WHERE role = 'admin';"
```

## 💻 Alternative Setup (Local Development)

⚠️ **Not Recommended**: Use this only if Docker is unavailable. Local setup is more complex and prone to environment issues.

### Prerequisites
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL** - [Download](https://www.postgresql.org/download/)
- **npm or yarn** - Comes with Node.js

### Setup Steps

1. **Install dependencies**
   ```bash
   # Install all dependencies
   npm run setup
   
   # Or install manually
   cd client && npm install
   cd ../server && npm install
   ```

2. **Environment configuration**
   ```bash
   # Copy environment templates
   cp server/.env.example server/.env
   cp client/.env.example client/.env.local
   ```

3. **Configure database connection**
   - Edit `server/.env` with your PostgreSQL credentials
   - Ensure PostgreSQL is running locally

4. **Initialize database**
   ```bash
   cd server
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start development servers**
   ```bash
   # From root directory - starts both frontend and backend
   npm run dev
   
   # Or start individually
   cd client && npm run dev    # Frontend on :3000
   cd server && npm run dev    # Backend on :5000
   ```

## ⚙️ Environment Variables Guide

### 🔧 Server Configuration (`server/.env`)

```env
# Database
DATABASE_URL="postgresql://beans_user:2w3E4r%T@localhost:5432/the_beans_db"

# Authentication
JWT_SECRET="your-super-secure-jwt-secret-key-here"
JWT_EXPIRES_IN="7d"

# Image Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"  
CLOUDINARY_API_SECRET="your_api_secret"

# Email (Optional - for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Server Configuration
PORT="5000"
NODE_ENV="development"
```

### 🌐 Client Configuration (`client/.env.local`)

```env
# API Connection
NEXT_PUBLIC_API_URL="http://localhost:5000"

# Image Storage (Cloudinary - Public)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"

# Maps (Optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_google_maps_api_key"

# App Configuration
NEXT_PUBLIC_APP_NAME="The Beans"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 🗃️ Manual Database Setup (Local Development Only)

**Note**: Skip this if using Docker - the database is automatically configured.

### 1. Install PostgreSQL
```bash
# Windows: Download from postgresql.org
# macOS
brew install postgresql

# Linux
sudo apt-get install postgresql postgresql-contrib
```

### 2. Create Database and User
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create user and database
CREATE USER beans_user WITH PASSWORD 'secure_password_here';
CREATE DATABASE the_beans_db OWNER beans_user;
GRANT ALL PRIVILEGES ON DATABASE the_beans_db TO beans_user;

-- Exit
\q
```

### 3. Update Environment Variable
```env
# In server/.env
DATABASE_URL="postgresql://beans_user:secure_password_here@localhost:5432/the_beans_db"
```

## 🔑 External API Keys Setup

### Cloudinary (Image Storage)
1. **Sign up** at [cloudinary.com](https://cloudinary.com)
2. **Get credentials** from your dashboard:
   - Cloud Name
   - API Key  
   - API Secret
3. **Add to environment files** (both server and client)

### Google Maps API (Optional)
1. **Go to** [Google Cloud Console](https://console.cloud.google.com)
2. **Enable APIs**: Maps JavaScript API, Geocoding API, Places API
3. **Create API Key** with appropriate restrictions
4. **Add to** `client/.env.local`

## 🎯 Development URLs

- 🌐 **Frontend**: [http://localhost:3000](http://localhost:3000)
- 🔧 **Backend API**: [http://localhost:5000](http://localhost:5000)
- 📚 **API Documentation**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- 🛡️ **Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)
- 🗃️ **Database Studio**: `cd server && npx prisma studio`

### 👤 Default Admin Credentials
- **Email**: `admin@example.com`
- **Password**: `admin123`

## 🚀 Production Deployment

### 🌟 Render.com Deployment (Recommended)

#### One-Click Deployment with Blueprint
1. **Fork/Clone** the repository to your GitHub account
2. **Sign up** at [Render.com](https://render.com) and connect your GitHub
3. **Create New** > **Blueprint** and select your repository
4. **Review Services** - Render will detect `render.yaml` and show:
   - `the-beans-api` (Backend API)
   - `the-beans-frontend` (Next.js Frontend) 
   - `the-beans-db` (PostgreSQL Database)
5. **Configure Environment Variables**:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_secret
   ```
6. **Deploy** - All services will be created and deployed automatically

#### Manual Service Configuration
If you prefer manual setup:
1. **Create PostgreSQL Database** service
2. **Create Web Service** for backend (Express.js)
3. **Create Web Service** for frontend (Next.js)
4. **Configure environment variables** for each service

### 🐳 Docker-Based Deployment
Alternative deployment using Docker containers with `docker-compose.yml`.

### 🗃️ Production Database
```bash
# Run migrations on production
npx prisma migrate deploy
npx prisma generate
```

## 🐛 Troubleshooting

### Docker Issues
- **Containers won't start**: Ensure Docker Desktop is running
- **Database connection fails**: Check if database container is healthy
- **Changes not visible**: Restart the appropriate container
- **Port conflicts**: Ensure ports 3000, 5000, 5432 are available

### Local Development Issues
- **PostgreSQL connection**: Verify database is running and credentials are correct
- **Node modules**: Delete `node_modules` and run `npm install`
- **Prisma issues**: Run `npx prisma generate` after schema changes
- **API calls fail**: Check if backend is running on correct port

### 🔧 Useful Commands
```bash
# Check what's running on ports
netstat -an | findstr :3000
netstat -an | findstr :5000

# Reset everything (Docker)
docker-compose down -v
docker-compose up --build

# Reset database
docker-compose exec server npx prisma migrate reset
```
3. Add PostgreSQL database service
4. Deploy!

### Domain Setup (Cloudflare)
1. Purchase your domain
2. Add it to Cloudflare
3. Update DNS records to point to your deployments
4. Enable SSL/TLS

## Features Overview

✅ **Current Features:**
- Beautiful purple-themed UI
- User authentication (signup/login)
- Roaster discovery and profiles
- Location-based search
- Responsive design (mobile/desktop)
- RESTful API with Swagger docs

🚧 **Coming Soon:**
- Cafe profiles linked to roasters
- Photo uploads
- User reviews and ratings
- Favorites system
- Push notifications
- Advanced filtering
- Map view
- Progressive Web App (PWA)

## Troubleshooting

### Common Issues

**Database Connection Error**
- Check PostgreSQL is running
- Verify DATABASE_URL format
- Ensure database exists

**Module Not Found Errors**
- Run `npm run setup` from root directory
- Check Node.js version (18+)

**API Errors**
- Check server logs in terminal
- Verify environment variables
- Check API documentation at /api-docs

## Support

For help or questions:
- Check the GitHub Issues
- Review API documentation at http://localhost:5000/api-docs
- Read the troubleshooting section above

Happy coding! ☕💜

> do i need to put quotes around my api key in the client/.env files?

No, you don't need quotes around API keys in .env files!