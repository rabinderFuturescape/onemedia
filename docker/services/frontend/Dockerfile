# syntax=docker/dockerfile:1.4
# Stage 1: Builder
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# 1) Install native build tools
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libstdc++ \
    linux-headers \
    pkgconfig \
    pixman-dev \
    cairo-dev \
    pango-dev \
    giflib-dev \
    libjpeg-turbo-dev \
    libpng-dev

# 2) Configure npm for resilience
RUN npm config set registry https://registry.npmjs.org/ \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm install -g npm@latest

# 3) Copy lockfiles
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/

# 4) Use BuildKit cache for npm downloads & install
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    npm ci --legacy-peer-deps --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma client
WORKDIR /app/libraries/nestjs-libraries/src/database/prisma
RUN npx prisma generate
WORKDIR /app

# Build the application using Nx
RUN npx nx run frontend:build:production

# Remove build tools to shrink image
RUN apk del make g++ linux-headers \
    && rm -rf /var/cache/apk/*

# Stage 2: Development
FROM builder AS development

# Set environment variables
ENV NODE_ENV=development

# Expose port
EXPOSE 3000

# Start the application in development mode
CMD ["npm", "run", "dev", "--workspace=frontend"]

# Stage 3: Test
FROM builder AS test

# Set environment variables
ENV NODE_ENV=test

# Start the application in test mode
CMD ["npm", "run", "test", "--workspace=frontend"]

# Stage 4: Runner
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./.next/static
COPY --from=builder /app/apps/frontend/public ./public

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
