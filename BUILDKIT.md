# Building with BuildKit

This document explains how to use Docker BuildKit to build the Postiz application containers more efficiently.

## What is BuildKit?

BuildKit is a modern builder toolkit for Docker that provides:
- Faster builds with improved caching
- Parallel build steps
- More efficient layer creation
- Better handling of secrets and SSH keys
- Improved output formatting

## Prerequisites

- Docker 18.09 or newer
- Docker Compose 1.25.0 or newer

## Building with BuildKit

### Option 1: Using the build scripts

We provide several scripts to build the application with BuildKit:

1. **build.sh** - The standard build script with BuildKit enabled
   ```bash
   ./build.sh
   ```

2. **build-with-buildkit.sh** - A more verbose build script with BuildKit enabled and progress output
   ```bash
   ./build-with-buildkit.sh
   ```

3. **docker-compose-build.sh** - Build all services using docker-compose with BuildKit enabled
   ```bash
   ./docker-compose-build.sh
   ```

### Option 2: Manual BuildKit activation

You can enable BuildKit manually by setting environment variables:

```bash
# Enable BuildKit for Docker
export DOCKER_BUILDKIT=1

# Enable BuildKit for Docker Compose
export COMPOSE_DOCKER_CLI_BUILD=1

# Then run your build commands
docker build -t postiz-frontend -f apps/frontend/Dockerfile .
# or
docker-compose -f docker/compose/docker-compose.yml build
```

### Option 3: Permanent BuildKit activation

To permanently enable BuildKit, add these settings to your Docker configuration file:

1. Edit or create `~/.docker/config.json`:
   ```json
   {
     "features": {
       "buildkit": true
     }
   }
   ```

2. For Docker Compose, add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):
   ```bash
   export COMPOSE_DOCKER_CLI_BUILD=1
   ```

## BuildKit Features Used in Our Dockerfiles

Our Dockerfiles are optimized for BuildKit with features like:

1. **Mount caching** for npm dependencies:
   ```dockerfile
   RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
       npm ci --legacy-peer-deps --ignore-scripts
   ```

2. **Multi-stage builds** to create smaller production images:
   ```dockerfile
   # Stage 1: Builder
   FROM node:20-alpine AS builder
   # ...build steps...

   # Stage 2: Runner
   FROM node:20-alpine AS runner
   # ...copy only what's needed from builder...
   ```

3. **Parallel execution** of build steps where possible

## Troubleshooting

If you encounter issues with BuildKit:

1. **Verify BuildKit is enabled**:
   ```bash
   echo $DOCKER_BUILDKIT
   echo $COMPOSE_DOCKER_CLI_BUILD
   ```
   Both should output `1`.

2. **Check Docker version**:
   ```bash
   docker --version
   docker-compose --version
   ```
   Ensure you have Docker 18.09+ and Docker Compose 1.25.0+.

3. **Clear Docker build cache** if you encounter strange caching issues:
   ```bash
   docker builder prune
   ```

4. **Use verbose output** to debug build issues:
   ```bash
   docker build --progress=plain -t postiz-frontend -f apps/frontend/Dockerfile .
   ```
