# Multi-stage build for backend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Add package manager cache to volume for better performance
RUN mkdir -p /app/.npm
ENV npm_config_cache=/app/.npm
ENV PYTHON=/usr/bin/python3

# Install node-gyp globally
RUN npm install -g node-gyp

# Install dependencies first (for better layer caching)
COPY package.json package-lock.json nx.json tsconfig.base.json ./
COPY apps/backend/package.json ./apps/backend/

# Install dependencies with ci for exact versions and skip optional dependencies
RUN npm ci --no-fund --quiet --no-optional

# Copy source code
COPY apps/backend ./apps/backend
COPY libraries ./libraries

# Build the application for production
RUN npm run build:backend

# Production image
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Install build dependencies for production
RUN apk add --no-cache python3 make g++ git

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=postgresql://postiz-user:postiz-password@postiz-postgres:5432/postiz-db-local
ENV REDIS_URL=redis://postiz-redis:6379
ENV FRONTEND_URL=http://localhost:4200
ENV ONESSO_URL=http://onesso:3002
ENV JWT_SECRET=onesso-jwt-secret
ENV PYTHON=/usr/bin/python3

# Install only production dependencies
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
RUN npm ci --only=production --no-fund --quiet --no-optional

# Copy only the built application
COPY --from=builder /app/dist/apps/backend ./

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O - http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "main.js"]

# Development image
FROM node:20-alpine AS development

# Set working directory
WORKDIR /app

# Install build dependencies for development
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package.json package-lock.json nx.json tsconfig.base.json ./

# Copy the backend app and libraries
COPY apps/backend ./apps/backend
COPY libraries ./libraries

# Set Python path
ENV PYTHON=/usr/bin/python3

# Install dependencies with more verbose output for debugging
RUN npm ci --no-fund --no-optional

# Set environment variables
ENV NODE_ENV=development
ENV PORT=3000
ENV DATABASE_URL=postgresql://postiz-user:postiz-password@postiz-postgres:5432/postiz-db-local
ENV REDIS_URL=redis://postiz-redis:6379
ENV FRONTEND_URL=http://localhost:4200
ENV ONESSO_URL=http://onesso:3002
ENV JWT_SECRET=onesso-jwt-secret

# Expose the port
EXPOSE 3000

# Start the backend app in development mode
CMD ["npm", "run", "dev:backend"]
