# Use Node.js 18 LTS (Debian-based for Prisma compatibility)
FROM node:18-slim

# Install required packages for Prisma and database connectivity
RUN apt-get update && \
    apt-get install -y openssl ca-certificates curl postgresql-client && \
    # Install Docker CLI
    curl -fsSL https://get.docker.com -o get-docker.sh && \
    sh get-docker.sh && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* get-docker.sh

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Expose port
EXPOSE 5000


# Build TypeScript before starting
RUN npm run build

# Start production server with Prisma migration
CMD ["sh", "-c", "sleep 10 && npx prisma migrate deploy && npm start"]
