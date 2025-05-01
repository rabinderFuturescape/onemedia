# Multi-stage build for frontend
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
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies with ci for exact versions and skip optional dependencies
RUN npm ci --no-fund --quiet --no-optional

# Copy source code
COPY apps/frontend ./apps/frontend
COPY libraries ./libraries

# Build the application for production
RUN npm run build:frontend

# Production image
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Install build dependencies for production
RUN apk add --no-cache python3 make g++ git

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4200
ENV NEXT_PUBLIC_BACKEND_URL=http://localhost:3000/api
ENV BACKEND_URL=http://postiz-backend:3000/api
ENV BACKEND_INTERNAL_URL=http://postiz-backend:3000/api
ENV FRONTEND_URL=http://localhost:4200
ENV STORAGE_PROVIDER=local
ENV IS_GENERAL=true
ENV NOT_SECURED=true
ENV NEXT_PUBLIC_ONESSO_URL=http://localhost:3002
ENV NEXTAUTH_URL=http://localhost:4200
ENV NEXTAUTH_SECRET=onesso-nextauth-secret
ENV PYTHON=/usr/bin/python3

# Install only production dependencies
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/
RUN npm ci --only=production --no-fund --quiet --no-optional

# Copy only the built application
COPY --from=builder /app/dist/apps/frontend ./

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the port
EXPOSE 4200

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O - http://localhost:4200/api/health || exit 1

# Start the application
CMD ["npm", "start"]

# Development image
FROM node:20-alpine AS development

# Set working directory
WORKDIR /app

# Install build dependencies for development
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package.json package-lock.json nx.json tsconfig.base.json ./

# Copy the frontend app and libraries
COPY apps/frontend ./apps/frontend
COPY libraries ./libraries

# Set Python path
ENV PYTHON=/usr/bin/python3

# Install dependencies with more verbose output for debugging
RUN npm ci --no-fund --no-optional

# Set environment variables
ENV NODE_ENV=development
ENV PORT=4200
ENV NEXT_PUBLIC_BACKEND_URL=http://localhost:3000/api
ENV BACKEND_URL=http://postiz-backend:3000/api
ENV BACKEND_INTERNAL_URL=http://postiz-backend:3000/api
ENV FRONTEND_URL=http://localhost:4200
ENV STORAGE_PROVIDER=local
ENV IS_GENERAL=true
ENV NOT_SECURED=true
ENV NEXT_PUBLIC_ONESSO_URL=http://localhost:3002
ENV NEXTAUTH_URL=http://localhost:4200
ENV NEXTAUTH_SECRET=onesso-nextauth-secret

# Expose the port
EXPOSE 4200

# Start the frontend app in development mode
CMD ["npm", "run", "dev:frontend"]
