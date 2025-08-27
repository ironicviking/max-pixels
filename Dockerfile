# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Install system dependencies for better development experience
RUN apk add --no-cache \
    git \
    curl \
    bash

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for development)
RUN npm ci

# Install http-server globally
RUN npm install -g http-server

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S maxpixels -u 1001 -G nodejs

# Copy application files
COPY --chown=maxpixels:nodejs . .

# Ensure proper permissions for node_modules
RUN chown -R maxpixels:nodejs /app/node_modules

# Switch to non-root user
USER maxpixels

# Expose port 3000
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start the development server
CMD ["npm", "run", "dev"]