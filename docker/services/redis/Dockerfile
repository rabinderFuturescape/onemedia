FROM redis:7-alpine

# Add health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD redis-cli ping || exit 1

# Copy custom Redis configuration
COPY docker/services/redis/redis.conf /usr/local/etc/redis/redis.conf

# Run Redis with the custom configuration
CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]
