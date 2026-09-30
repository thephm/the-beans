#!/bin/bash

echo "Waiting for database..."
sleep 10
echo "Starting server..."

npx prisma generate
npx prisma migrate deploy
npx prisma db seed
exec npm run dev
