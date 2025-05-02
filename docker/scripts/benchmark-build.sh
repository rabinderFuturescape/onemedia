#!/usr/bin/env bash
set -e

# Enable Docker BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

echo "Benchmarking Docker builds with BuildKit enabled"

# First build - should be slower as it builds from scratch
echo "First build (from scratch):"
time docker-compose -f docker/compose/docker-compose.benchmark.yml build --no-cache

# Second build - should be faster due to caching
echo "Second build (with caching):"
time docker-compose -f docker/compose/docker-compose.benchmark.yml build

echo "Benchmark completed!"
