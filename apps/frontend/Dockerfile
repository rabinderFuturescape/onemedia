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

# 3) Copy package files first to leverage Docker layer caching
COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json ./

# Create directory structure
RUN mkdir -p apps/frontend

# 4) Use BuildKit cache for npm downloads & install
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    npm ci --legacy-peer-deps --ignore-scripts

# 5) Copy ALL source files to ensure build scripts are present
COPY . .

# 6) Explicitly run the update-plugins script if it exists
RUN if [ -f build.plugins.js ]; then npm run update-plugins; fi

# 7) Run prisma generate
RUN npm run prisma-generate

# 8) Build the application
RUN npx nx run frontend:build:production

# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Configure npm for resilience
RUN npm config set registry https://registry.npmjs.org/ \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm install -g npm@latest

# Copy package files for production dependencies
COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json ./

# Create directory structure
RUN mkdir -p apps/frontend

# Use BuildKit cache for npm downloads & install production dependencies
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    npm ci --only=production --legacy-peer-deps --ignore-scripts

# Copy built application from builder stage
COPY --from=builder /app/dist/apps/frontend/.next ./.next
COPY --from=builder /app/dist/apps/frontend/public ./public
COPY --from=builder /app/dist/apps/frontend/next.config.js ./

# Set user to non-root for security
USER node

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
