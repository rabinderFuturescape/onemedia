# Stage 1: Builder
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies for node-gyp
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

# Copy package files
COPY package*.json ./
COPY ${SERVICE_DIR}/package*.json ./${SERVICE_DIR}/

# Install dependencies with legacy peer deps to handle conflicts
RUN npm install -g npm@latest && \
    npm ci --legacy-peer-deps --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma client (if needed)
WORKDIR /app
RUN if [ -d "./libraries/nestjs-libraries/src/database/prisma" ]; then \
      WORKDIR="/app/libraries/nestjs-libraries/src/database/prisma" && \
      npx prisma generate; \
    fi
WORKDIR /app

# Build the application using Nx
RUN npx nx run "${SERVICE_NAME}":build:production

# Remove build tools to shrink image
RUN apk del make g++ linux-headers \
    && rm -rf /var/cache/apk/*

# Stage 2: Development
FROM builder AS development

# Set environment variables
ENV NODE_ENV=development

# Expose port
EXPOSE ${PORT}

# Start the application in development mode
CMD ["npm", "run", "dev", "--workspace=${SERVICE_NAME}"]

# Stage 3: Test
FROM builder AS test

# Set environment variables
ENV NODE_ENV=test

# Start the application in test mode
CMD ["npm", "run", "test", "--workspace=${SERVICE_NAME}"]

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
COPY --from=builder /app/${SERVICE_DIR}/package*.json ./
COPY --from=builder /app/dist/${SERVICE_DIR} ./dist
COPY --from=builder /app/${SERVICE_DIR}/node_modules ./node_modules

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Expose port
EXPOSE ${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Start the application
CMD ["node", "dist/main"]
