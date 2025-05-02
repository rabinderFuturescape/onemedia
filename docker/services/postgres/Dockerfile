FROM postgres:17-alpine

# Add health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
  CMD pg_isready -U postiz-user -d postiz-db-local || exit 1

# Add custom initialization scripts if needed
COPY docker/services/postgres/init-scripts/ /docker-entrypoint-initdb.d/

# Set recommended PostgreSQL configurations
COPY docker/services/postgres/postgresql.conf /etc/postgresql/postgresql.conf

CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]
