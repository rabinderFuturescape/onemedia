#!/bin/bash

# Test OneSSO Integration Script
# This script sets up and tests the OneSSO integration with admin user

# Configure npm for native modules
echo "Configuring npm for native modules..."
npm config set python /usr/bin/python3
npm config set node-gyp $(which node-gyp)
npm config set legacy-peer-deps true

# Stop and remove any existing containers
echo "Stopping and removing existing containers..."
docker-compose -f docker-compose.onesso-test.yml down

# Start the services
echo "Starting services..."
docker-compose -f docker-compose.onesso-test.yml up -d

# Wait for Keycloak to be ready
echo "Waiting for Keycloak to be ready..."
until curl -s --fail http://localhost:8080/auth/health > /dev/null; do
  echo "Waiting for Keycloak..."
  sleep 5
done
echo "Keycloak is ready!"

# Initialize Keycloak with the onesso realm and admin user
echo "Initializing Keycloak..."
./scripts/init-keycloak.sh

# Wait for the backend to be ready
echo "Waiting for backend to be ready..."
until curl -s --fail http://localhost:3000/api/health > /dev/null; do
  echo "Waiting for backend..."
  sleep 5
done
echo "Backend is ready!"

# Wait for the frontend to be ready
echo "Waiting for frontend to be ready..."
until curl -s --fail http://localhost:4200 > /dev/null; do
  echo "Waiting for frontend..."
  sleep 5
done
echo "Frontend is ready!"

echo "OneSSO integration test environment is ready!"
echo "You can now access the application at http://localhost:4200"
echo "Use the following credentials to log in:"
echo "  Email: admin@example.com"
echo "  Password: admin"
