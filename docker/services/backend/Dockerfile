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
COPY apps/backend/package.json ./apps/backend/

# 4) Use BuildKit cache for npm downloads & install
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    npm ci --legacy-peer-deps --ignore-scripts

# Copy source code
COPY . .

# Build the application using Nx
RUN npx nx run backend:build:production

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
CMD ["npm", "run", "dev", "--workspace=backend"]

# Stage 3: Test
FROM builder AS test

# Set environment variables
ENV NODE_ENV=test

# Start the application in test mode
CMD ["npm", "run", "test", "--workspace=backend"]

# Stage 4: Runner
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Install minimal production dependencies
RUN apk add --no-cache \
    python3 \
    libstdc++

# Set environment variables
ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/apps/backend/package*.json ./
COPY --from=builder /app/dist/apps/backend ./dist
COPY --from=builder /app/apps/backend/node_modules ./node_modules

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/main"]
