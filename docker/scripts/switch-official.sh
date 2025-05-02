#!/usr/bin/env bash
set -e

# This script switches the docker-compose.yml file to use official images

echo "Switching to official images..."

# Restore the original docker-compose.yml file if backup exists
if [ -f docker/compose/docker-compose.yml.bak ]; then
  cp docker/compose/docker-compose.yml.bak docker/compose/docker-compose.yml
  echo "Restored original docker-compose.yml from backup"
else
  # Otherwise, manually replace the image names
  sed -i.bak 's|image: localhost/postiz.*|image: ghcr.io/gitroomhq/postiz-app:latest|g' docker/compose/docker-compose.yml
  echo "Switched to official images (ghcr.io/gitroomhq/postiz-app:latest)"
fi

echo "Done! Run 'docker-compose up -d' to start the application with official images."
