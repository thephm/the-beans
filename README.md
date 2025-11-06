# The Beans - Coffee Roaster Discovery App

A beautiful, modern full-stack web application for discovering and exploring specialty coffee roasters. Built with Next.js 14, Express.js, and PostgreSQL in a Docker-first development environment.

## 🚀 Features

### Core Features
- 🌍 **Location-based Discovery**: Find coffee roasters near you
- ☕ **Roaster Profiles**: Detailed information including contact info, hours, and bean offerings
- � **Owner Contact Information**: Store roaster owner details (name, email, bio, mobile)
- �👥 **User Authentication**: Secure sign up and login system
- ⭐ **Reviews & Favorites**: Rate roasters and save your favorites
- 📸 **Image Uploads**: Upload and share roaster photos
- 🔔 **Notifications**: Stay updated on new roasters and activity

### Technical Features
- 🔒 **Secure API**: RESTful API with comprehensive Swagger documentation
- 🌐 **Internationalization**: Full i18n support (English/French)
- 💜 **Beautiful Design**: Purple-themed UI with lavender, violet, and orchid colors
- 🔒 **Admin Dashboard**: Complete user and role management (admin only)
- � **Audit Logging**: Comprehensive activity tracking with geolocation and change history
- �📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- 🐳 **Docker-First**: Containerized development and deployment

### Architecture
- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Backend**: Express.js API with Prisma ORM
- **Database**: PostgreSQL
- **Deployment**: Docker-based containerization
- **CDN**: Cloudflare for assets and domain management

## 🐳 Quick Start (Docker - Recommended)

**⚠️ Critical**: This project requires Docker container restarts for code changes to take effect. Hot reload is unreliable due to Docker volume mounting.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Git](https://git-scm.com/)

### Setup Steps

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

**Essential**: Always restart containers after code changes:

```bash
# After making frontend changes
docker-compose restart client

# After making backend changes  
docker-compose restart server

# Rebuild everything if needed
docker-compose up --build

# Stop all services
docker-compose down
```

### 👤 Default Admin Account
- **Email**: `admin@example.com`
- **Password**: `admin123`

### 🗃️ Database Management

```bash
# Connect to PostgreSQL shell
docker exec -it the-beans-database-1 psql -U beans_user -d the_beans_db

# Check admin users
docker exec -it the-beans-database-1 psql -U beans_user -d the_beans_db -c "SELECT email, username, role FROM users WHERE role = 'admin';"

# Run database migrations
docker-compose exec server npx prisma migrate dev

# Generate Prisma client after schema changes
docker-compose exec server npx prisma generate

# Reset database (careful!)
docker-compose exec server npx prisma migrate reset
```

## 📧 Contact Us Email Setup

To enable the Contact Us form and email notifications, configure the following environment variables in `server/.env`:

```
# Contact Us email recipient
CONTACT_US_EMAIL=your-contact-email@example.com

# SMTP server settings
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

- The `CONTACT_US_EMAIL` is the address that will receive messages from the Contact Us form.
- The SMTP settings must match your email provider's requirements.
- After updating `.env`, restart the server container:
  ```bash
  docker-compose restart server
  ```

If you need to test email delivery, use a service like [Mailtrap](https://mailtrap.io/) or your own SMTP credentials.

---

##  Documentation

Comprehensive documentation is maintained in the [`docs/`](./docs/) directory following docs-as-code principles.

### Core Documentation
- 🏗️ [Architecture Overview](./docs/architecture.md)
- 📖 [Documentation Index](./docs/README.md)
- 📝 [Glossary](./docs/glossary.md)
- ⚙️ [Setup Guide](./SETUP.md)

### Feature Documentation
- 🔐 [Authentication System](./docs/auth/README.md)
- 🔍 [Search & Discovery](./docs/search/README.md)
- ☕ [Roaster Management](./docs/roasters/README.md)
- ⭐ [Favorites & Reviews](./docs/favorites/README.md)
- 👤 [User Profiles](./docs/profile/README.md)
- ⚙️ [Settings & Preferences](./docs/settings/README.md)
- 🛡️ [Admin Dashboard](./docs/admin/README.md)
- 📊 [Audit Logging](./docs/admin/audit-logging.md)

## 🏗️ Project Structure

```
the-beans/
├── 🌐 client/                    # Next.js 14 Frontend
│   ├── src/
│   │   ├── app/                 # App Router pages & layouts
│   │   ├── components/          # Reusable React components
│   │   ├── contexts/            # React Context providers
│   │   ├── lib/                # Utilities & configurations
│   │   └── types/              # TypeScript type definitions
│   ├── public/
│   │   ├── locales/            # i18n translation files
│   │   └── images/             # Static images & icons
│   └── Dockerfile              # Frontend container config
├── 🔧 server/                   # Express.js Backend
│   ├── src/
│   │   ├── routes/             # RESTful API endpoints
│   │   ├── middleware/         # Auth & validation middleware
│   │   └── lib/               # Server utilities
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   ├── migrations/        # Database migrations
│   │   └── seed.ts           # Database seeding
│   ├── uploads/               # File upload storage
│   └── Dockerfile            # Backend container config
├── 📚 docs/                    # Documentation (docs-as-code)
├── 🐳 docker-compose.yml       # Multi-service orchestration
└── 📋 Various config files     # Setup, CI/CD, etc.
```

## 🛠️ Development

### 🎯 Key Development Patterns

#### API Routes (`server/src/routes/`)
- **Authentication**: `optionalAuth` (public), `requireAuth` (protected)
- **Admin Routes**: Check `user.role === 'admin'` 
- **Validation**: express-validator for input sanitization
- **Error Handling**: Consistent JSON error responses

#### Frontend API Client (`client/src/lib/api.ts`)
- Centralized API client with JWT token management
- Base URL: `http://localhost:5000` (configurable)
- Automatic token injection and refresh

#### Database (Prisma)
```bash
# After schema changes
docker-compose exec server npx prisma generate
docker-compose exec server npx prisma migrate dev
```

### 🔧 Adding New Features
1. **Backend**: Add routes in `server/src/routes/` with proper middleware
2. **Frontend**: Create components in `client/src/components/`
3. **Database**: Update `server/prisma/schema.prisma` + generate + migrate
4. **i18n**: Add translations to `client/public/locales/{en,fr}/common.json`
5. **Restart**: Always restart containers after changes

### 🧪 Testing Strategy
- **Frontend**: Jest + React Testing Library
- **Backend**: Jest + Supertest for API testing
- **E2E**: Playwright for integration tests
- **Manual**: Admin dashboard at `/admin` (requires admin login)

## 🚀 Deployment

### 🌟 Render.com (Recommended)
The Beans includes a complete `render.yaml` configuration for one-click deployment on Render.com:

1. **Connect** your GitHub repository to [Render.com](https://render.com)
2. **Create** a new Blueprint from your repository (Render will detect `render.yaml`)
3. **Configure** environment variables in Render dashboard:
   ```
   # Required for all deployments
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_secret
   
   # For custom domains (optional)
   CORS_ORIGIN=https://yourdomain.com
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   ```
4. **Deploy** - Render will automatically create:
   - PostgreSQL database
   - Backend API service (Express.js)
   - Frontend web service (Next.js)

### 🐳 Docker-Based Deployment
Alternative deployment using Docker containers with `docker-compose.yml`.

### 🗃️ Database Migration
```bash
# Automatic via render.yaml build process
# Or manual via Render shell:
npx prisma migrate deploy
npx prisma generate
```

## 🤝 Contributing

### Development Process
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Develop** using Docker: `docker-compose up --build`
4. **Restart** containers after changes: `docker-compose restart client server`
5. **Test** your changes thoroughly
6. **Commit** your changes: `git commit -m 'Add amazing feature'`
7. **Push** to branch: `git push origin feature/amazing-feature`
8. **Submit** a pull request

### Code Standards
- **TypeScript**: Strict typing required
- **ESLint**: Follow configured rules
- **Prettier**: Auto-formatting enabled
- **i18n**: All user-facing text must be translatable
- **Tests**: Include tests for new features
- **Documentation**: Update docs for new features

## ⚠️ Important Development Notes

### Docker-First Workflow
- **Always restart containers** after code changes: `docker-compose restart client server`
- **Hot reload is unreliable** in the Docker environment
- **Database changes require** Prisma generate + migrate
- **New translations require** client container restart

### Common Issues
- **Container won't start**: Check Docker Desktop is running
- **Database connection fails**: Ensure PostgreSQL container is healthy
- **API calls fail**: Verify backend container is running on port 5000
- **Changes not visible**: Restart the appropriate container
- **Admin access needed**: Use `admin@example.com` / `admin123`

### URLs & Access
- 🌐 Frontend: [http://localhost:3000](http://localhost:3000)
- 🔧 Backend: [http://localhost:5000](http://localhost:5000)
- 📚 API Docs: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- 🛡️ Admin Panel: [http://localhost:3000/admin](http://localhost:3000/admin)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 **Email**: support@the-beans.app
- 🐛 **Issues**: [GitHub Issues](https://github.com/thephm/the-beans/issues)
- 📚 **Documentation**: [./docs/](./docs/)
- 🚀 **Setup Help**: [SETUP.md](./SETUP.md)
