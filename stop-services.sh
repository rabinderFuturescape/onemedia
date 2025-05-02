#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to display a step message
step() {
    echo -e "${YELLOW}==>${NC} $1"
}

# Function to display a success message
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Parse command line arguments
ENVIRONMENT="production"
REMOVE_VOLUMES=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --dev) ENVIRONMENT="development"; shift ;;
        --prod) ENVIRONMENT="production"; shift ;;
        --clean) REMOVE_VOLUMES=true; shift ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
done

# Set Docker Compose files based on environment
COMPOSE_FILES="-f docker/compose/docker-compose.yml"
if [ "$ENVIRONMENT" = "development" ]; then
    COMPOSE_FILES="$COMPOSE_FILES -f docker/compose/docker-compose.override.yml"
    step "Stopping development environment"
else
    step "Stopping production environment"
fi

# Stop all services
if [ "$REMOVE_VOLUMES" = true ]; then
    step "Stopping all services and removing volumes..."
    docker-compose $COMPOSE_FILES down -v
    success "All services stopped and volumes removed"
else
    step "Stopping all services (preserving volumes)..."
    docker-compose $COMPOSE_FILES down
    success "All services stopped (volumes preserved)"
fi
