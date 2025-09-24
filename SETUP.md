# The Beans - Setup Guide

Welcome to The Beans coffee roaster discovery app! This guide will help you get everything up and running.

## Prerequisites

- Docker and Docker Compose
- Git

## Recommended Setup (Docker)

**⚠️ Important**: Docker is the recommended development environment. Container restarts are required for code changes.

1. **Clone and start**
   ```bash
   git clone https://github.com/thephm/the-beans.git
   cd the-beans
   docker-compose up --build
   ```

2. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - API Docs: http://localhost:5000/api-docs

3. **Development workflow**
   ```bash
   # After frontend changes
   docker-compose restart client
   
   # After backend changes
   docker-compose restart server
   
   # Database access
   docker exec -it the-beans-database-1 psql -U beans_user -d the_beans_db
   ```

## Alternative Setup (Local Development)

Only use this if you cannot use Docker:

1. **Prerequisites**
   - Node.js 18+ 
   - PostgreSQL database locally installed

2. **Install dependencies**
   ```bash
   npm run setup
   ```

3. **Set up environment variables**
   - Copy `server/.env.example` to `server/.env`
   - Copy `client/.env.example` to `client/.env.local`
   - Configure your local PostgreSQL connection in `server/.env`

4. **Initialize database**
   ```bash
   cd server
   npm run db:generate
   npm run db:push
   ```

5. **Start development servers**
   ```bash
   # From root directory
   npm run dev
   ```

## Environment Variables Guide

### Server (.env)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens (generate a secure random string)
- `CLOUDINARY_*`: For image uploads (sign up at cloudinary.com)
- `SMTP_*`: For email notifications (optional)

### Client (.env.local)
- `NEXT_PUBLIC_API_URL`: Backend API URL (http://localhost:5000 for development)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: For map features (get from Google Cloud Console)

## Database Setup

1. **Install PostgreSQL** (if not already installed)
   - Windows: Download from postgresql.org
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Create database and user**
   ```sql
   CREATE USER the_beans_user WITH PASSWORD 'your_password';
   CREATE DATABASE the_beans_db OWNER the_beans_user;
   GRANT ALL PRIVILEGES ON DATABASE the_beans_db TO the_beans_user;
   ```

3. **Update DATABASE_URL in server/.env**
   ```
   DATABASE_URL="postgresql://the_beans_user:your_password@localhost:5432/the_beans_db"
   ```

## API Keys Setup

### Cloudinary (Image Storage)
1. Sign up at cloudinary.com
2. Get your cloud name, API key, and API secret
3. Add to server/.env

### Google Maps (Optional - for enhanced location features)
1. Go to Google Cloud Console
2. Enable Maps JavaScript API and Geocoding API
3. Create an API key
4. Add to client/.env.local

## Development

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs
- **Database Admin**: `cd server && npm run db:studio`

## Deployment

### Frontend (Vercel)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

### Backend (Railway/Render)
1. Connect your GitHub repository
2. Set environment variables
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