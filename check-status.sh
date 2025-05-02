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

# Parse command line arguments
ENVIRONMENT="production"
SERVICE=""
LOGS=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --dev) ENVIRONMENT="development"; shift ;;
        --prod) ENVIRONMENT="production"; shift ;;
        --logs) LOGS=true; shift ;;
        --service=*) SERVICE="${1#*=}"; shift ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
done

# Set Docker Compose files based on environment
COMPOSE_FILES="-f docker/compose/docker-compose.yml"
if [ "$ENVIRONMENT" = "development" ]; then
    COMPOSE_FILES="$COMPOSE_FILES -f docker/compose/docker-compose.override.yml"
    step "Checking development environment"
else
    step "Checking production environment"
fi

# Check service status
step "Current service status:"
docker-compose $COMPOSE_FILES ps

# Show logs if requested
if [ "$LOGS" = true ]; then
    if [ -n "$SERVICE" ]; then
        step "Showing logs for $SERVICE service:"
        docker-compose $COMPOSE_FILES logs -f "$SERVICE"
    else
        step "Showing logs for all services:"
        docker-compose $COMPOSE_FILES logs -f
    fi
fi
