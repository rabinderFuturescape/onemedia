#!/bin/bash

# Enable BuildKit for all Docker builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

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

# Build all services with BuildKit
echo "Building all services with BuildKit..."
docker-compose -f docker/compose/docker-compose.yml build --parallel

echo "All services built successfully with BuildKit!"
echo "Run 'docker-compose -f docker/compose/docker-compose.yml up -d' to start the application."
