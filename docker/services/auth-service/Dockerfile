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

# 2) Configure npm via ENV (applies to all npm commands)
ENV NODE_OPTIONS="--max-old-space-size=4096" \
    NPM_CONFIG_REGISTRY="https://registry.npmjs.org/" \
    NPM_CONFIG_FETCH_RETRIES=10 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=30000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=180000 \
    NPM_CONFIG_PREFER_OFFLINE=true \
    NPM_CONFIG_STRICT_SSL=true

# 3) Create .npmrc to avoid CLI deprecation warnings
RUN printf "fetch-retries=10\nfetch-retry-mintimeout=30000\nfetch-retry-maxtimeout=180000\nprefer-offline=true\nstrict-ssl=true\n" > .npmrc \
    && npm install -g npm@10.2.4 @nestjs/cli

# 4) Copy lockfiles to maximize layer caching
COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json ./

# Create directory structure
RUN mkdir -p apps/auth-service

# Copy scripts
COPY scripts ./scripts

# 5) Use BuildKit cache for npm downloads & install
RUN --mount=type=cache,id=auth-npm-cache,target=/root/.npm \
    npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund --no-progress && \
    node scripts/update-core-js.js

# Copy the rest of the application code
COPY . .

# Build the application
RUN npx nx run auth-service:build:production

# Remove build tools to shrink image
RUN apk del make g++ linux-headers \
    && rm -rf /var/cache/apk/*

# Stage 2: Test
FROM development AS test

ENV NODE_ENV=test

CMD ["npx", "nx", "run", "auth-service:test"]

# Stage 3: Production
FROM node:20-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV} \
    NODE_OPTIONS="--max-old-space-size=4096" \
    NPM_CONFIG_REGISTRY="https://registry.npmjs.org/" \
    NPM_CONFIG_FETCH_RETRIES=10 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=30000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=180000 \
    NPM_CONFIG_PREFER_OFFLINE=true \
    NPM_CONFIG_STRICT_SSL=true

WORKDIR /usr/src/app

# Install minimal production dependencies
RUN apk add --no-cache \
    python3 \
    libstdc++

# Create .npmrc to avoid CLI deprecation warnings
RUN printf "fetch-retries=10\nfetch-retry-mintimeout=30000\nfetch-retry-maxtimeout=180000\nprefer-offline=true\nstrict-ssl=true\n" > .npmrc \
    && npm install -g npm@10.2.4

# Copy package files for production dependencies
COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json ./

# Create directory structure
RUN mkdir -p apps/auth-service

# Copy scripts
COPY scripts ./scripts

# Use BuildKit cache for npm downloads & install production dependencies
RUN --mount=type=cache,id=auth-npm-prod-cache,target=/root/.npm \
    npm ci --only=production --legacy-peer-deps --ignore-scripts --no-audit --no-fund --no-progress && \
    node scripts/update-core-js.js

# Copy built application from development stage
COPY --from=development /usr/src/app/dist ./dist

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /usr/src/app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

EXPOSE 3001

CMD ["node", "dist/apps/auth-service/main"]
