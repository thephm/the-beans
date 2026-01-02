#!/bin/bash
# Resolve failed migration in production

# Mark the migration as rolled back
npx prisma migrate resolve --rolled-back 20260101201138_sync_images_column

# Apply migrations again
npx prisma migrate deploy
