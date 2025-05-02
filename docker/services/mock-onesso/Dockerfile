FROM node:20-slim
WORKDIR /app

# Install runtime dependencies
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      wget=1.21.3-1+b2 \
      python3=3.11.2-1+b1 \
      make=4.3-4.1 \
      g++=4:12.2.0-3 \
      python3-pip=23.0.1+dfsg-1 \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3002

# Copy package.json and install dependencies
COPY docker/services/mock-onesso/package.json ./
RUN npm install --production --legacy-peer-deps

# Remove build tools to shrink image
RUN apt-get purge -y make g++ \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Copy server.js
COPY docker/services/mock-onesso/server.js ./

# Create non-root user
RUN groupadd -r mockuser && useradd -r -g mockuser mockuser
RUN chown -R mockuser:mockuser /app
USER mockuser

# Expose the application port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O - http://localhost:3002/api/health || exit 1

# Set the entrypoint
CMD ["node", "server.js"]
