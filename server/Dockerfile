# Use Node.js 18 LTS (Debian-based for Prisma compatibility)
FROM node:18-slim

# Install required packages for Prisma and database connectivity
RUN apt-get update && \
    apt-get install -y netcat-openbsd openssl ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

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

# Start development server with Prisma migration
CMD ["sh", "-c", "sleep 10 && npx prisma migrate deploy && npm run dev"]
