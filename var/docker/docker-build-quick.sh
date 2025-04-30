#!/bin/bash

set -o xtrace

# This script builds a simplified Docker image for testing purposes
# It skips the full build process and just copies the source code

# Remove existing image
docker rmi localhost/postiz-quick || true

# Create a Dockerfile.quick for a simpler build
cat > Dockerfile.quick << 'EOF'
FROM node:20.17-alpine3.19

# Install required packages
RUN apk add --no-cache \
    caddy \
    bash=5.2.21-r0 \
    supervisor=4.2.5-r4

# Set up directories
WORKDIR /app

# Copy configuration files
COPY var/docker/entrypoint.sh /app/entrypoint.sh
COPY var/docker/supervisord.conf /etc/supervisord.conf
COPY var/docker/supervisord /app/supervisord_available_configs/
COPY var/docker/Caddyfile /app/Caddyfile
COPY .env.example /config/postiz.env

# Copy source code
COPY . /app/

# Set permissions
RUN chmod +x /app/entrypoint.sh

# Set up volumes and ports
VOLUME ["/config", "/uploads"]
EXPOSE 5000

# Set entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
EOF

# Build the quick image
docker build -t localhost/postiz-quick -f Dockerfile.quick .

# Remove the temporary Dockerfile
rm Dockerfile.quick

echo "Quick build complete. Use 'localhost/postiz-quick' as your image in docker-compose.yml"
