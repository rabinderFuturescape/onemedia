#!/usr/bin/env bash
set -e

# This script switches the docker-compose.yml file to use local images

MODE=${1:-standard}  # standard | quick

echo "Switching to local $MODE build..."

# Create a backup of the original docker-compose.yml file
cp docker/compose/docker-compose.yml docker/compose/docker-compose.yml.bak

if [[ $MODE == "quick" ]]; then
  # Use the quick local build
  sed -i.bak 's|image: .*|image: localhost/postiz-quick|g' docker/compose/docker-compose.yml
  echo "Switched to quick local build (localhost/postiz-quick)"
else
  # Use the standard local build
  sed -i.bak 's|image: .*|image: localhost/postiz|g' docker/compose/docker-compose.yml
  echo "Switched to standard local build (localhost/postiz)"
fi

echo "Done! Run 'docker-compose up -d' to start the application with local images."
