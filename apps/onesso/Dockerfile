# syntax=docker/dockerfile:1.4
# Stage 1: Development
FROM node:20-alpine AS development

WORKDIR /usr/src/app

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
RUN mkdir -p apps/onesso

# 4) Use BuildKit cache for npm downloads & install with reduced memory usage
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    NODE_OPTIONS="--max-old-space-size=4096" \
    npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund

# 5) Copy ALL source files to ensure build scripts are present
COPY . .

# 6) Explicitly run the update-plugins script if it exists
RUN if [ -f build.plugins.js ]; then npm run update-plugins; fi

# 7) Run prisma generate
RUN npm run prisma-generate

# 8) Build the application
RUN NODE_OPTIONS="--max-old-space-size=4096" npx nx run onesso:build:production

# 9) Remove build tools to shrink image
RUN apk del make g++ linux-headers \
    && rm -rf /var/cache/apk/*

# Stage 2: Production
FROM node:20-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

# Install minimal production dependencies
RUN apk add --no-cache \
    python3 \
    libstdc++

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
RUN mkdir -p apps/onesso

# Use BuildKit cache for npm downloads & install production dependencies with reduced memory usage
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    NODE_OPTIONS="--max-old-space-size=4096" \
    npm ci --only=production --legacy-peer-deps --ignore-scripts --no-audit --no-fund

# Copy built application from development stage
COPY --from=development /usr/src/app/dist ./dist

# Set user to non-root for security
USER node

# Expose the port the app will run on
EXPOSE 3002

CMD ["node", "dist/apps/onesso/main"]
