# The Beans - Coffee Roaster Discovery App

A beautiful, modern web application for discovering fresh coffee roasters and cafes near you. Built with Next.js, Node.js, and PostgreSQL.

## Features

- 🌍 **Location-based Discovery**: Find coffee roasters and cafes near you
- ☕ **Roaster Profiles**: Detailed information about coffee roasters including contact info, hours, and bean prices
- 🏪 **Cafe Tracking**: Link roasters to their physical cafe locations
- 👥 **User Accounts**: Sign up for notifications about new locations
- 📱 **Cross-platform**: Works on web, Android, and iOS
- 🔗 **Deep Linking**: Every page is directly linkable
- 📸 **Photos & Reviews**: Share photos and comments with moderation
- 🔒 **Secure API**: RESTful API with Swagger documentation
- 💜 **Beautiful Design**: Purple-themed UI with lavender, violet, and orchid colors

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling with custom purple theme
- **PWA** - Progressive Web App for mobile installation
- **Framer Motion** - Smooth animations

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Prisma** - Database ORM
- **JWT** - Authentication
- **Swagger** - API documentation
- **Cloudinary** - Image storage

### Deployment
- **Vercel** - Frontend hosting
- **Railway/Render** - Backend hosting
- **Cloudflare** - CDN and domain management

## Quick Start

1. **Install dependencies**
   ```bash
   npm run setup
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env` in both client and server directories
   - Fill in your database and API keys

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Frontend: http://localhost:3000
   - API Documentation: http://localhost:5000/api-docs

## Project Structure

```
the-beans/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # Reusable components
│   │   ├── lib/          # Utilities and configs
│   │   └── types/        # TypeScript types
│   └── public/           # Static assets
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/  # API controllers
│   │   ├── middleware/   # Express middleware
│   │   ├── models/      # Database models
│   │   ├── routes/      # API routes
│   │   └── utils/       # Utilities
│   └── prisma/          # Database schema
└── docs/                 # Documentation
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
