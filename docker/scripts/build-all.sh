#!/usr/bin/env bash
set -e

# Parse arguments
MODE=${1:-all}  # all | dev | prod | test | onesso
COMPOSE="-f docker/compose/docker-compose.yml"

if [[ $MODE == dev ]]; then
  COMPOSE="$COMPOSE -f docker/compose/docker-compose.override.yml"
elif [[ $MODE == test ]]; then
  COMPOSE="$COMPOSE -f docker/compose/docker-compose.test.yml"
fi

echo "Building Docker images for Postiz with mode: $MODE"

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

# Build the images
echo "Building images with command: docker-compose $COMPOSE build ${@:2}"
docker-compose $COMPOSE build ${@:2}

echo "All images built successfully!"
echo "Run 'docker-compose $COMPOSE up -d' to start the application."
