FROM node:20-slim
WORKDIR /app

# Install runtime dependencies
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      wget \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3002

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install --production

# Copy server.js
COPY server.js ./

# Expose the application port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O - http://localhost:3002/api/health || exit 1

# Set the entrypoint
CMD ["node", "server.js"]
