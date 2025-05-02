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

echo "Building Docker images for Postiz with mode: $MODE using BuildKit (sequential build)"

# Build infrastructure services first
echo "Building infrastructure services..."
if [[ $CACHE == no-cache ]]; then
  docker-compose $COMPOSE build --pull --no-cache postgres redis keycloak
else
  docker-compose $COMPOSE build postgres redis keycloak
fi

# Build application services one by one
echo "Building auth-service..."
if [[ $CACHE == no-cache ]]; then
  docker-compose $COMPOSE build --no-cache auth-service
else
  docker-compose $COMPOSE build auth-service
fi

echo "Building onesso..."
if [[ $CACHE == no-cache ]]; then
  docker-compose $COMPOSE build --no-cache onesso
else
  docker-compose $COMPOSE build onesso
fi

echo "Building backend..."
if [[ $CACHE == no-cache ]]; then
  docker-compose $COMPOSE build --no-cache backend
else
  docker-compose $COMPOSE build backend
fi

echo "Building frontend..."
if [[ $CACHE == no-cache ]]; then
  docker-compose $COMPOSE build --no-cache frontend
else
  docker-compose $COMPOSE build frontend
fi

echo "Sequential build completed successfully!"
