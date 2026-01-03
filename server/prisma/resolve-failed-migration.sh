#!/bin/bash
# This script resolves the failed migration in production
# Run this manually on Render or use it as a build command

echo "==> Resolving failed migration..."
npx prisma migrate resolve --applied "20260103010059_add_instagram_url_to_person"

echo "==> Running new migrations..."
npx prisma migrate deploy

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Starting server..."
npm run start
