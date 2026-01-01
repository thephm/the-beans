# The Beans - Project Overview

**The Beans** is a modern, full-stack coffee roaster discovery platform designed to connect coffee enthusiasts with specialty roasters in their area. Built with a Docker-first development approach for consistency and reliability.

## Project Vision

Create a beautiful, user-friendly platform where coffee lovers can:
- **Discover** specialty coffee roasters near them
- **Connect** with the coffee community through reviews and favourites
- **Explore** the world of specialty coffee through detailed roaster profiles
- **Share** their coffee experiences with photos and reviews

## Feature Highlights

### **Beautiful Purple-Themed Design**
- Custom Tailwind CSS with lavender, violet, and orchid color palette
- Smooth animations and transitions using Framer Motion
- Fully responsive design optimized for all devices
- Progressive Web App (PWA) capabilities for mobile installation

### **Modern Architecture**
- **Frontend**: Next.js 14 (App Router) with TypeScript and React 18
- **Backend**: Express.js API with TypeScript and Prisma ORM
- **Database**: PostgreSQL with comprehensive relational schema
- **DevOps**: Docker Compose orchestration for development
- **Authentication**: Secure JWT-based authentication system

### **Core Features**
- **Roaster Discovery**: Find coffee roasters near you with location-based search
- **User Accounts**: Sign up, login, and personalized profiles
- **Search & Filters**: Advanced search by location, specialty
- **Review System**: Rate and review roasters
- **Favourites**: Save your favourite coffee roasters
- **Photo Uploads**: Share beautiful coffee photos (Cloudinary integration ready)

### **Cross-Platform Support**
- Works seamlessly on iOS, Android, and desktop browsers
- PWA manifest for mobile app-like experience
- Deep linking support for sharing specific roasters

### **Secure & Professional**
- RESTful API with comprehensive Swagger documentation
- JWT authentication with secure password hashing
- Comprehensive audit logging with IP geolocation tracking
- Input validation and sanitization
- Rate limiting and security headers
- CORS configuration
- Admin dashboard with activity monitoring

### **Database Schema**
Complete database design with:
- Users, Roasters, Reviews, Comments
- Favourites system, Notifications
- Comprehensive Audit Logging with geolocation tracking
- Geolocation support for proximity search
- Flexible JSON fields for hours and metadata

## **Quick Start Guide**

### 1. **Install Dependencies**
```bash
cd client && npm install
cd ../server && npm install
```

### 2. **Set Up Database**
- Install PostgreSQL
- Create database: `the_beans_db`
- Update `server/.env` with your database URL

### 3. **Configure Environment**
- Copy `server/.env.example` to `server/.env`
- Copy `client/.env.example` to `client/.env.local`
- Fill in your actual values (database, API keys, etc.)

### 4. **Initialize Database**
```bash
cd server
npx prisma generate
npx prisma db push
npm run db:seed  # Adds sample data
```

### 5. **Start Development**
```bash
# From root directory
npm run dev
```

This starts both frontend (localhost:3000) and backend (localhost:5000)!

## **Sample Data Included**

I've created sample roasters for you:
- **Purple Mountain Coffee** (Seattle) - Ethiopian specialists
- **Lavender Bean Co.** (Portland) - Espresso experts  
- **Violet Coffee Works** (San Francisco) - Cold brew innovators

**Test Account**: `coffee@lover.com` / `password123`

## **API Documentation**

Once running, visit `http://localhost:5000/api-docs` for complete API documentation with Swagger UI.

## **Key API Endpoints**

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/roasters` - Get roasters with filters
- `GET /api/roasters/:id` - Get specific roaster details
- `GET /api/search` - Search roasters
- `POST /api/roasters` - Create new roaster (authenticated)

## **Deployment Ready**

### **Frontend (Docker-Based)**
- Docker containerization for consistent deployment
- Environment variables ready
- Custom domain support with Cloudflare

### **Backend (Railway/Render)**
- Docker-ready configuration
- PostgreSQL database integration
- Environment variable templates

## **Future Enhancements**

The foundation is set for:
- **Push Notifications** for new roasters near users
- **Advanced Map View** with clustering
- **Social Features** (follow users, share favourites)
- **Bean Inventory Tracking** with pricing
- **Event System** for coffee tastings and events
- **Mobile Apps** using React Native (easy migration)

## **Your Beautiful Design**

The app features your requested purple color palette:
- **Lavender** (#f3f0ff) for light backgrounds
- **Violet** (#a673ff) for primary actions  
- **Orchid** (#ec7cff) for accents
- **Deep Purple** (#551dae) for contrast

Clean, modern interface with smooth animations and intuitive navigation.

## **Next Steps**

1. **Test the app**: Start the development servers and explore
2. **Customize**: Adjust colors, add your branding
3. **Add content**: Use the admin interface to add real roasters
4. **Deploy**: Follow the deployment guide for your chosen platform
5. **Domain**: Set up your custom domain with Cloudflare

## **Need Help?**

- Read `SETUP.md` for detailed setup instructions
- Check `README.md` for project overview
- Visit API docs at `/api-docs` for API reference
- Review the sample data in `server/src/seed.ts`

Your coffee roaster discovery app is ready to help coffee lovers find amazing local roasters! The beautiful purple-themed interface, comprehensive features, and solid technical foundation will make this a delightful platform for the coffee community.

**Happy brewing!**