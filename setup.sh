#!/bin/bash

# The Beans - Coffee Roaster Discovery App Setup Script
# This script will help you set up the entire application

echo "☕ Welcome to The Beans Setup!"
echo "This script will help you set up your coffee roaster discovery app."
echo ""

# Check if Node.js is installed
echo "🔍 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node --version)
echo "✅ Node.js $NODE_VERSION found!"

# Check if npm is available
echo "🔍 Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found!"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo "✅ npm $NPM_VERSION found!"

# Install root dependencies
echo ""
echo "📦 Installing root dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install root dependencies!"
    exit 1
fi

# Install client dependencies
echo ""
echo "📦 Installing client dependencies..."
cd client
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install client dependencies!"
    exit 1
fi
cd ..

# Install server dependencies
echo ""
echo "📦 Installing server dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install server dependencies!"
    exit 1
fi

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client!"
    exit 1
fi
cd ..

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your PostgreSQL database"
echo "2. Copy server/.env.example to server/.env and fill in your database URL"
echo "3. Copy client/.env.example to client/.env.local"
echo "4. Run 'cd server && npm run db:push' to create database tables"
echo "5. Run 'cd server && npm run db:seed' to add sample data"
echo "6. Run 'npm run dev' from the root directory to start both servers"
echo ""
echo "📚 Read SETUP.md for detailed instructions!"
echo ""
echo "🚀 Your coffee app is ready to brew! ☕💜"
