#!/bin/bash
set -e

# Remove existing image if it exists
docker rmi localhost/postiz-modified || true

# Build the Docker image with the modified Dockerfile
echo "Building Docker image with modified Dockerfile..."
docker build -t localhost/postiz-modified -f Dockerfile.modified .

echo "Docker image built successfully: localhost/postiz-modified"
