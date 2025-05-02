#!/usr/bin/env bash
set -e

echo "Cleaning up old Docker files..."

# Remove Dockerfiles from apps directory
rm -f ./apps/frontend/Dockerfile
rm -f ./apps/backend/Dockerfile
rm -f ./apps/auth-service/Dockerfile
rm -f ./apps/onesso/Dockerfile

# Remove old Docker files from var directory
rm -rf ./var/docker

echo "Cleanup complete!"
