#!/bin/bash
set -e

# Remove existing image if it exists
docker rmi localhost/postiz-prebuild || true

# Build the application first
echo "Building the application..."
npm install
npm run build

# Now build the Docker image with the pre-built files
echo "Building Docker image..."
docker build --target dist -t localhost/postiz-prebuild -f Dockerfile.dev .

echo "Docker image built successfully: localhost/postiz-prebuild"
