#!/bin/bash

set -e

echo "Building Docker images for Postiz with real onesso integration..."

# Stop any running containers
echo "Stopping any running containers..."
docker-compose -f docker-compose.real.yml down

# Build and start the containers
echo "Building and starting containers..."
docker-compose -f docker-compose.real.yml up -d

echo "All containers are now running!"
echo "You can access the application at http://localhost:4200"
