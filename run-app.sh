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

# Function to display an error message and exit
error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

# Check if infrastructure services are running
step "Checking if infrastructure services are running..."
if ! docker-compose -f docker/compose/docker-compose.yml ps | grep -q "Up"; then
    error "Infrastructure services are not running. Please run ./build-infra.sh first."
fi
success "Infrastructure services are running"

# Run the application in development mode
step "Running the application in development mode..."

# Start the backend
step "Starting the backend..."
cd apps/backend
npm run start:dev &
BACKEND_PID=$!
success "Backend started with PID: $BACKEND_PID"

# Start the frontend
step "Starting the frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
success "Frontend started with PID: $FRONTEND_PID"

# Start the onesso service
step "Starting the onesso service..."
cd ../onesso
npm run start:dev &
ONESSO_PID=$!
success "OneSSO service started with PID: $ONESSO_PID"

# Start the auth-service
step "Starting the auth-service..."
cd ../../docker/services/auth-service
npm run start:dev &
AUTH_SERVICE_PID=$!
success "Auth service started with PID: $AUTH_SERVICE_PID"

# Return to the root directory
cd ../../../

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

echo -e "${GREEN}Admin credentials for Keycloak/OneSSO:${NC}"
echo "Username: admin@example.com"
echo "Password: admin"
echo ""

# Wait for user to press Ctrl+C
echo "Press Ctrl+C to stop all services"
trap "kill $BACKEND_PID $FRONTEND_PID $ONESSO_PID $AUTH_SERVICE_PID; echo -e '\n${GREEN}All services stopped${NC}'" INT
wait
