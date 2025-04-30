#!/bin/bash
# Script to switch docker-compose.yml to use the local image

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: docker-compose.yml not found in the current directory."
    exit 1
fi

# Check if quick build is requested
if [ "$1" == "quick" ]; then
    # Update the image in docker-compose.yml to use quick build
    sed -i '' 's|image: ghcr.io/gitroomhq/postiz-app:.*|# Using our quick build local image with all code modifications\n    image: localhost/postiz-quick|g' docker-compose.yml
    sed -i '' 's|# Using our local image with all code modifications\n    image: localhost/postiz|# Using our quick build local image with all code modifications\n    image: localhost/postiz-quick|g' docker-compose.yml

    echo "Updated docker-compose.yml to use the quick build local image (localhost/postiz-quick)"
    echo "To build the quick local image, run: ./var/docker/docker-build-quick.sh"
else
    # Update the image in docker-compose.yml to use standard build
    sed -i '' 's|image: ghcr.io/gitroomhq/postiz-app:.*|# Using our local image with all code modifications\n    image: localhost/postiz|g' docker-compose.yml
    sed -i '' 's|# Using our quick build local image with all code modifications\n    image: localhost/postiz-quick|# Using our local image with all code modifications\n    image: localhost/postiz|g' docker-compose.yml

    echo "Updated docker-compose.yml to use the local image (localhost/postiz)"
    echo "To build the local image, run: ./var/docker/docker-build.sh"
fi

echo "To start the containers with the local image, run: docker compose up -d"
