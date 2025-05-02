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

# Build infrastructure services first
step "Building infrastructure services (postgres, redis, keycloak)..."
docker-compose -f docker/compose/docker-compose.yml build postgres redis keycloak
success "Infrastructure services built successfully"

# Build backend services one by one
step "Building backend service..."
docker-compose -f docker/compose/docker-compose.yml build backend
success "Backend service built successfully"

step "Building auth-service..."
docker-compose -f docker/compose/docker-compose.yml build auth-service
success "Auth service built successfully"

step "Building onesso service..."
docker-compose -f docker/compose/docker-compose.yml build onesso
success "OneSSO service built successfully"

step "Building frontend service..."
docker-compose -f docker/compose/docker-compose.yml build frontend
success "Frontend service built successfully"

# Start all services
step "Starting all services..."
docker-compose -f docker/compose/docker-compose.yml up -d
success "All services started successfully"

# Display access information
echo ""
echo -e "${GREEN}=== Postiz Application is Running ===${NC}"
echo ""
echo "Frontend:       http://localhost:3000"
echo "Backend API:    http://localhost:3001"
echo "OneSSO:         http://localhost:3003"
echo "Auth Service:   http://localhost:3002"
echo "Keycloak:       http://localhost:8080"
echo ""

echo "To view logs: docker-compose -f docker/compose/docker-compose.yml logs -f"
echo "To stop:      docker-compose -f docker/compose/docker-compose.yml down"
echo ""
echo -e "${GREEN}Admin credentials for Keycloak/OneSSO:${NC}"
echo "Username: admin@example.com"
echo "Password: admin"
