#!/bin/bash

# Enable BuildKit for all Docker builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required commands
if ! command_exists docker; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

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

# Parse command line arguments
ENVIRONMENT="production"
CLEAN_BUILD=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --dev) ENVIRONMENT="development"; shift ;;
        --prod) ENVIRONMENT="production"; shift ;;
        --clean) CLEAN_BUILD=true; shift ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
done

# Set Docker Compose files based on environment
COMPOSE_FILES="-f docker/compose/docker-compose.yml"
if [ "$ENVIRONMENT" = "development" ]; then
    COMPOSE_FILES="$COMPOSE_FILES -f docker/compose/docker-compose.override.yml"
    step "Setting up development environment"
else
    step "Setting up production environment"
fi

# Clean build if requested
if [ "$CLEAN_BUILD" = true ]; then
    step "Performing clean build (removing existing images and containers)"
    docker-compose $COMPOSE_FILES down -v
    docker-compose $COMPOSE_FILES rm -f
    docker system prune -f
fi

# Build all services
step "Building all services with BuildKit..."
if ! docker-compose $COMPOSE_FILES build; then
    error "Failed to build services"
fi
success "All services built successfully"

# Start all services
step "Starting all services..."
if ! docker-compose $COMPOSE_FILES up -d; then
    error "Failed to start services"
fi
success "All services started successfully"

# Wait for services to be healthy
step "Waiting for services to be healthy..."
sleep 5

# Check service health
step "Checking service health..."
docker-compose $COMPOSE_FILES ps

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

if [ "$ENVIRONMENT" = "development" ]; then
    echo "Development Tools:"
    echo "PgAdmin:        http://localhost:8081 (admin@admin.com / admin)"
    echo "RedisInsight:   http://localhost:5540"
    echo ""
fi

echo "To view logs: docker-compose $COMPOSE_FILES logs -f"
echo "To stop:      docker-compose $COMPOSE_FILES down"
echo ""
echo -e "${GREEN}Admin credentials for Keycloak/OneSSO:${NC}"
echo "Username: admin@example.com"
echo "Password: admin"
