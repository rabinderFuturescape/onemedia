#!/bin/bash
# Script to switch docker-compose.yml to use the official image

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: docker-compose.yml not found in the current directory."
    exit 1
fi

# Update the image in docker-compose.yml - handle both standard and quick build cases
sed -i '' 's|# Using our local image with all code modifications\n    image: localhost/postiz|image: ghcr.io/gitroomhq/postiz-app:v1.36.1-amd64  # Use v1.36.1-arm64 for ARM-based systems|g' docker-compose.yml
sed -i '' 's|# Using our quick build local image with all code modifications\n    image: localhost/postiz-quick|image: ghcr.io/gitroomhq/postiz-app:v1.36.1-amd64  # Use v1.36.1-arm64 for ARM-based systems|g' docker-compose.yml

echo "Updated docker-compose.yml to use the official image (ghcr.io/gitroomhq/postiz-app:v1.36.1-amd64)"
echo "To start the containers with the official image, run: docker compose up -d"
