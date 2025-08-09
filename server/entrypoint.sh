#!/bin/sh
echo "Starting entrypoint script..."

# Function to wait for database to be ready
wait_for_db() {
  echo "Waiting for database to be ready..."
  while ! nc -z database 5432; do
    echo "Database is not ready yet, waiting 1 second..."
    sleep 1
  done
  echo "Database is ready!"
}

# Wait for the database to be ready
wait_for_db

# Additional wait to ensure PostgreSQL is fully ready
echo "Giving database a few more seconds to fully initialize..."
sleep 5

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Deploy migrations with retries
echo "Deploying database migrations..."
for i in 1 2 3 4 5; do
  echo "Migration attempt $i..."
  if npx prisma migrate deploy; then
    echo "Migrations deployed successfully!"
    break
  else
    echo "Migration attempt $i failed, waiting 5 seconds before retry..."
    sleep 5
  fi
  
  if [ $i -eq 5 ]; then
    echo "All migration attempts failed, but continuing anyway..."
  fi
done

# Start the server
echo "Starting server..."
exec npm run dev
