FROM node:20-alpine

WORKDIR /usr/src/app

# Install build dependencies for node-gyp
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libstdc++ \
    linux-headers

# Copy package.json and package-lock.json
COPY docker/services/test-onesso/package.json docker/services/test-onesso/package-lock.json* ./

# Install dependencies with exact versions from package-lock.json if available
RUN if [ -f package-lock.json ]; then \
      npm ci --legacy-peer-deps --ignore-scripts; \
    else \
      npm install --legacy-peer-deps --ignore-scripts; \
    fi

# Remove build tools to shrink image
RUN apk del make g++ linux-headers \
    && rm -rf /var/cache/apk/*

# Copy source code
COPY docker/services/test-onesso/test-onesso-integration.js ./

# Create non-root user
RUN addgroup -S testgroup && adduser -S testuser -G testgroup
RUN chown -R testuser:testgroup /usr/src/app
USER testuser

# Start the application
CMD ["node", "test-onesso-integration.js"]
