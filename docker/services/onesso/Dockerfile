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

# 3) Copy lockfiles
COPY package.json package-lock.json ./
COPY apps/onesso/package.json ./apps/onesso/

# 4) Use BuildKit cache for npm downloads & install
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    npm ci --legacy-peer-deps --ignore-scripts

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build --workspace=onesso

# Remove build tools to shrink image
RUN apk del make g++ linux-headers \
    && rm -rf /var/cache/apk/*

# Stage 2: Test
FROM development AS test

ENV NODE_ENV=test

CMD ["npm", "run", "test", "--workspace=onesso"]

# Stage 3: Production
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
COPY apps/onesso/package.json ./apps/onesso/

# Use BuildKit cache for npm downloads & install production dependencies
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    npm ci --only=production --legacy-peer-deps --ignore-scripts

# Copy built application from development stage
COPY --from=development /usr/src/app/dist ./dist

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /usr/src/app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

EXPOSE 3002

CMD ["node", "dist/main"]
