#!/bin/bash

# Enable BuildKit for all Docker builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

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

# Function to display an error message and exit
error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

# Build infrastructure services
step "Building infrastructure services (postgres, redis, keycloak)..."
docker-compose -f docker/compose/docker-compose.yml build postgres redis keycloak
success "Infrastructure services built successfully"

# Start infrastructure services
step "Starting infrastructure services..."
docker-compose -f docker/compose/docker-compose.yml up -d postgres redis keycloak
success "Infrastructure services started successfully"

# Display access information
echo ""
echo -e "${GREEN}=== Infrastructure Services are Running ===${NC}"
echo ""
echo "Postgres:       localhost:5432"
echo "Redis:          localhost:6380"
echo "Keycloak:       http://localhost:8080"
echo ""

echo "To view logs: docker-compose -f docker/compose/docker-compose.yml logs -f postgres redis keycloak"
echo "To stop:      docker-compose -f docker/compose/docker-compose.yml down"
echo ""
echo -e "${GREEN}Admin credentials for Keycloak:${NC}"
echo "Username: admin"
echo "Password: admin"
