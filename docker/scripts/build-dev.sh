#!/usr/bin/env bash
set -e

# This script builds all services for development

echo "Building Docker images for Postiz (Development)"

# Call the main build script with dev mode
./docker/scripts/build-all.sh dev
