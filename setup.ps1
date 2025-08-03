#!/usr/bin/env pwsh

# The Beans - Coffee Roaster Discovery App Setup Script
# This script will help you set up the entire application

Write-Host "☕ Welcome to The Beans Setup!" -ForegroundColor Magenta
Write-Host "This script will help you set up your coffee roaster discovery app." -ForegroundColor White
Write-Host ""

# Check if Node.js is installed
Write-Host "🔍 Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = & node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js not found! Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js $nodeVersion found!" -ForegroundColor Green

# Check if npm is available
Write-Host "🔍 Checking npm..." -ForegroundColor Yellow
$npmVersion = & npm --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm not found!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ npm $npmVersion found!" -ForegroundColor Green

# Install root dependencies
Write-Host ""
Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install root dependencies!" -ForegroundColor Red
    exit 1
}

# Install client dependencies
Write-Host ""
Write-Host "📦 Installing client dependencies..." -ForegroundColor Yellow
Set-Location client
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install client dependencies!" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Install server dependencies
Write-Host ""
Write-Host "📦 Installing server dependencies..." -ForegroundColor Yellow
Set-Location server
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install server dependencies!" -ForegroundColor Red
    exit 1
}

# Generate Prisma client
Write-Host ""
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client!" -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host ""
Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Set up your PostgreSQL database" -ForegroundColor White
Write-Host "2. Copy server/.env.example to server/.env and fill in your database URL" -ForegroundColor White
Write-Host "3. Copy client/.env.example to client/.env.local" -ForegroundColor White
Write-Host "4. Run 'cd server && npm run db:push' to create database tables" -ForegroundColor White
Write-Host "5. Run 'cd server && npm run db:seed' to add sample data" -ForegroundColor White
Write-Host "6. Run 'npm run dev' from the root directory to start both servers" -ForegroundColor White
Write-Host ""
Write-Host "📚 Read SETUP.md for detailed instructions!" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Your coffee app is ready to brew! ☕💜" -ForegroundColor Magenta
