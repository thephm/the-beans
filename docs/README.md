# The Beans Documentation

Welcome to the comprehensive documentation for **The Beans** - a modern coffee roaster discovery platform!

## 📋 Product Overview

The Beans is a full-stack web application for discovering, reviewing, and managing specialty coffee roasters. Built with a Docker-first development approach, it provides a complete platform for coffee enthusiasts and roaster businesses.

### 🚀 Key Features
- **Location-based Discovery**: Find roasters near you
- **User Authentication**: Secure registration and login
- **Reviews & Favorites**: Rate and save favorite roasters  
- **Admin Dashboard**: Complete user and content management
- **Internationalization**: Full i18n support (English/French)
- **Responsive Design**: Works on all devices

## 🏗️ Documentation Structure

### Core Architecture
- 📐 [**Architecture Overview**](architecture.md) - System design and technical stack
- 📚 [**Glossary**](glossary.md) - Key terms and definitions

### Feature Documentation

#### User Features
- 🔐 [**Authentication System**](./auth/README.md) - Login, registration, JWT tokens
- 🔍 [**Search & Discovery**](./search/README.md) - Find and filter roasters
- ☕ [**Roaster Management**](./roasters/README.md) - Roaster profiles and data
- ⭐ [**Favorites & Reviews**](./favorites/README.md) - User interaction features
- 👤 [**User Profiles**](./profile/README.md) - Profile management and settings
- ⚙️ [**Settings & Preferences**](./settings/README.md) - User customization

#### Administrative Features  
- 🛡️ [**Admin Dashboard**](./admin/README.md) - User management and system administration
- 📊 [**Audit Logging**](./admin/audit-logging.md) - Comprehensive activity tracking and monitoring

## 🐳 Development Notes

This project uses a **Docker-first development approach**. Key points:

- **Container restarts required** for code changes to take effect
- **Hot reload is unreliable** in Docker environment  
- **Database operations** require Prisma generate/migrate
- **Full setup instructions** available in [main README](../README.md)

## 🔧 Quick Navigation

- 🏠 [**Back to Main README**](../README.md)
- ⚙️ [**Setup Guide**](../SETUP.md)  
- 🐳 [**Docker Documentation**](../DOCKER.md)
- 📋 [**Project Summary**](../PROJECT_SUMMARY.md)
