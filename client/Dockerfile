# Use Node.js 18 LTS (non-Alpine for Next.js compatibility)
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Use entrypoint script to ensure node_modules is present
ENTRYPOINT ["sh", "./entrypoint.sh"]
