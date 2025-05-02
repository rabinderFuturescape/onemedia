#!/usr/bin/env bash
set -e

echo "Linting Dockerfiles..."

# Check if hadolint is installed
if ! command -v hadolint &> /dev/null; then
    echo "Error: hadolint is not installed. Please install it first."
    echo "On macOS: brew install hadolint"
    echo "On Linux: https://github.com/hadolint/hadolint#install"
    exit 1
fi

# Lint all Dockerfiles in the services directory
echo "Linting service Dockerfiles..."
hadolint --config docker/.hadolint.yaml docker/services/*/Dockerfile

# Lint template Dockerfiles
echo "Linting template Dockerfiles..."
hadolint --config docker/.hadolint.yaml docker/templates/*.Dockerfile

echo "All Dockerfiles passed linting!"
