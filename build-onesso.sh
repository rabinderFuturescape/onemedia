#!/bin/bash

set -e

echo "Building Docker images for Postiz with onesso integration..."

# Build the frontend image
echo "Building frontend image..."
docker build -t postiz-frontend -f Dockerfile.frontend .

# Build the backend image
echo "Building backend image..."
docker build -t postiz-backend -f Dockerfile.backend .

echo "All images built successfully!"
echo "Run 'docker-compose -f docker-compose.onesso.yml up -d' to start the application."
