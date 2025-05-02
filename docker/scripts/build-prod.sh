#!/usr/bin/env bash
set -e

# This script builds all services for production

echo "Building Docker images for Postiz (Production)"

# Call the main build script with prod mode
./docker/scripts/build-all.sh prod
