#!/bin/bash

set -o xtrace

# Remove existing images
docker rmi localhost/postiz || true

# Only build the dist target for testing
# This skips the devcontainer target which takes a long time to build
docker build --target dist -t localhost/postiz -f Dockerfile.dev .

# Uncomment the line below if you need the devcontainer image
# docker build --target devcontainer -t localhost/postiz-devcontainer -f Dockerfile.dev .
