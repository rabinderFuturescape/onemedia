#!/bin/bash

# Enable BuildKit for all Docker builds
export DOCKER_BUILDKIT=1

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required commands
if ! command_exists docker; then
    echo "Error: Docker is not installed"
    exit 1
fi

if ! command_exists docker-compose; then
    echo "Error: Docker Compose is not installed"
    exit 1
fi

# Build frontend with BuildKit
echo "Building frontend container with BuildKit..."
docker build --progress=plain -t postiz-frontend -f apps/frontend/Dockerfile .

# Build backend with BuildKit
echo "Building backend container with BuildKit..."
docker build --progress=plain -t postiz-backend -f apps/backend/Dockerfile .

# Build onesso with BuildKit
echo "Building onesso container with BuildKit..."
docker build --progress=plain -t postiz-onesso -f apps/onesso/Dockerfile .

# Build auth-service with BuildKit
echo "Building auth-service container with BuildKit..."
docker build --progress=plain -t postiz-auth-service -f docker/services/auth-service/Dockerfile .

echo "All containers built successfully with BuildKit!"
echo "Run 'docker-compose up -d' to start the application."
