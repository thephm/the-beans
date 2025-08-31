# The Beans - Coffee Roaster Discovery App

A beautiful, modern web application for discovering fresh coffee roasters near you. Built with Next.js, Node.js, and PostgreSQL.

## Features

- 🌍 **Location-based Discovery**: Find coffee roasters near you
- ☕ **Roaster Profiles**: Detailed information about coffee roasters including contact info, hours, and bean offerings
- 👥 **User Accounts**: Sign up for notifications about new roasters
- 📱 **Cross-platform**: Works on web, Android, and iOS
- 🔗 **Deep Linking**: Every page is directly linkable
- 📸 **Photos & Reviews**: Share photos and comments with moderation

- 🔒 **Secure API**: RESTful API with Swagger documentation
- 💜 **Beautiful Design**: Purple-themed UI with lavender, violet, and orchid colors
- 🔒 **Admin Dashboard**: Manage users, roles, and permissions (admin only)

- **Railway/Render** - Backend hosting
- **Cloudflare** - CDN and domain management

## Quick Start (with Docker)

1. **Clone the repository**
   ```bash
   git clone https://github.com/thephm/the-beans.git
   cd the-beans
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env` in both `client` and `server` directories
   - Fill in your database and API keys as needed

3. **Build and start all services with Docker Compose**
   ```bash
   docker-compose up --build -d
   ```

4. **Open your browser**
   - Frontend: http://localhost:3000
   - API Documentation: http://localhost:5000/api-docs

## Local Development (without Docker)

1. **Install dependencies**
   ```bash
   npm run setup
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env` in both client and server directories
   - Fill in your database and API keys

3. **Run the development servers**
   ```bash
   npm run dev
   ```


## Documentation

Full project documentation, requirements, and specs are kept as code in the [`docs/`](./docs/) directory.

- [Project Index](./docs/index.md)
- [Architecture Overview](./docs/architecture.md)
- [Glossary](./docs/glossary.md)
- [Feature Specs](./docs/)
   - [Auth](./docs/auth/overview.md)
   - [Search](./docs/search/overview.md)
   - [Roasters](./docs/roasters/overview.md)
   - [Favorites](./docs/favorites/overview.md)
   - [Profile](./docs/profile/overview.md)
   - [Settings](./docs/settings/overview.md)

## Project Structure

```
the-beans/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # Reusable components
│   │   ├── lib/           # Utilities and configs
│   │   └── types/         # TypeScript types
│   └── public/            # Static assets
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── lib/           # Utilities
│   └── prisma/            # Database schema & migrations
└── docker-compose.yml      # Docker Compose setup
```

## Development

### Adding New Features
1. Backend: Add routes in `server/src/routes/`
2. Frontend: Create components in `client/src/components/`
3. Database: Update schema in `server/prisma/schema.prisma`

### Testing
- Frontend: Jest + Testing Library
- Backend: Jest + Supertest
- E2E: Playwright

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Backend (Railway)
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Add PostgreSQL database service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For support, email support@the-beans.app or create an issue on GitHub.
