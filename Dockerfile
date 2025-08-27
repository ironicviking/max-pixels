# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Install http-server globally
RUN npm install -g http-server

# Copy application files
COPY . .

# Expose port 3000
EXPOSE 3000

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S maxpixels -u 1001 -G nodejs

# Change ownership of the app directory
RUN chown -R maxpixels:nodejs /app
USER maxpixels

# Start the development server
CMD ["npm", "run", "dev"]