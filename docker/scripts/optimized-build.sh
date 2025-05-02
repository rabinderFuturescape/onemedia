#!/usr/bin/env bash
set -e

# Enable Docker BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Parse arguments
MODE=${1:-all}  # all | dev | prod | test | onesso
CACHE=${2:-use-cache}  # use-cache | no-cache

COMPOSE="-f docker/compose/docker-compose.yml"

if [[ $MODE == dev ]]; then
  COMPOSE="$COMPOSE -f docker/compose/docker-compose.override.yml"
elif [[ $MODE == test ]]; then
  COMPOSE="$COMPOSE -f docker/compose/docker-compose.test.yml"
fi

echo "Building Docker images for Postiz with mode: $MODE using BuildKit"

# Check if we should use cache
if [[ $CACHE == no-cache ]]; then
  echo "Building without cache to ensure fresh images"
  docker-compose $COMPOSE build --pull --no-cache
else
  echo "Building with cache for faster builds"
  docker-compose $COMPOSE build
fi

echo "Build completed successfully!"
