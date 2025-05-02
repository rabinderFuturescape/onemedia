# Docker Configuration for Postiz

This directory contains all Docker-related files for the Postiz application.

## Directory Structure

- `compose/`: Docker Compose files
  - `docker-compose.yml`: Main Docker Compose file for production
  - `docker-compose.override.yml`: Development overrides
  - `docker-compose.test.yml`: Test configuration
  - `docker-compose.monitoring.yml`: Monitoring stack configuration

- `scripts/`: Build and helper scripts
  - `build-all.sh`: Main build script with mode selection
  - `build-prod.sh`: Production build script
  - `build-dev.sh`: Development build script
  - `build-with-buildkit.sh`: Build script with BuildKit enabled for better caching
  - `switch-local.sh`: Switch to local images
  - `switch-official.sh`: Switch to official images
  - `lint-dockerfiles.sh`: Script to lint all Dockerfiles
  - `cleanup-old-docker-files.sh`: Script to remove old Docker files

- `.hadolint.yaml`: Configuration file for Hadolint Docker linter

- `templates/`: Generic Dockerfile templates
  - `node-service.Dockerfile`: Template for Node.js services

- `services/`: Per-service Dockerfiles and configurations for infrastructure services
  - `postgres/`: PostgreSQL database service
  - `redis/`: Redis cache service
  - `keycloak/`: Keycloak identity service
  - `prometheus/`: Prometheus monitoring service
  - `grafana/`: Grafana dashboard service
  - `mock-onesso/`: Mock OneSSO service for testing
  - `test-onesso/`: OneSSO integration tests

Note: Application service Dockerfiles are now located in their respective app directories:
  - `apps/frontend/Dockerfile`: Next.js frontend service
  - `apps/backend/Dockerfile`: NestJS backend service
  - `apps/auth-service/Dockerfile`: Authentication service
  - `apps/onesso/Dockerfile`: OneSSO service

- `caddy/`: Caddy server configurations
  - `Caddyfile`: Main Caddy configuration

- `supervisord/`: Supervisor configurations
  - `supervisord.conf`: Main Supervisor configuration

## Usage

### Linting Dockerfiles

Before building or committing changes to Dockerfiles, it's recommended to run the linting script to catch common Docker anti-patterns:

```bash
./docker/scripts/lint-dockerfiles.sh
```

This script uses [Hadolint](https://github.com/hadolint/hadolint) to check for best practices in all Dockerfiles. The linting rules are configured in `docker/.hadolint.yaml`.

### Testing Locally Before Dockerizing

Before building Docker images, it's recommended to test the build process locally to catch any issues:

```bash
# Test all services
./scripts/test-build-locally.sh

# Test a specific service
./scripts/test-build-locally.sh auth-service
./scripts/test-build-locally.sh onesso
./scripts/test-build-locally.sh frontend
./scripts/test-build-locally.sh backend
```

This script will:
1. Run any custom scripts needed for the build (e.g., update-plugins.js, prisma-generate.js)
2. Build the specified service(s)
3. Report any errors that occur during the build process

### Building Images

#### With BuildKit (Recommended)

BuildKit provides better caching and performance for Docker builds:

```bash
# Build all services with caching
./docker/scripts/build-with-buildkit.sh

# Build all services without caching (clean build)
./docker/scripts/build-with-buildkit.sh all no-cache

# Build development environment
./docker/scripts/build-with-buildkit.sh dev

# Build test environment
./docker/scripts/build-with-buildkit.sh test

# Build services sequentially (to conserve memory)
./docker/scripts/build-with-buildkit.sh all use-cache sequential

# Build services sequentially without cache
./docker/scripts/build-with-buildkit.sh all no-cache sequential
```

#### Sequential Builds

For systems with limited memory, you can use the sequential build script to build services one at a time:

```bash
# Build all services sequentially
./docker/scripts/sequential-build.sh

# Build all services sequentially without cache
./docker/scripts/sequential-build.sh all no-cache
```

This approach is recommended when you encounter memory issues during parallel builds, as it ensures only one service is installing dependencies at any given time.

#### Traditional Build

To build all services:

```bash
./docker/scripts/build-all.sh
```

To build for development:

```bash
./docker/scripts/build-dev.sh
```

To build for production:

```bash
./docker/scripts/build-prod.sh
```

To build for testing:

```bash
./docker/scripts/build-all.sh test
```

### Running the Application

To run the application in production mode:

```bash
docker-compose -f docker/compose/docker-compose.yml up -d
```

To run the application in development mode:

```bash
docker-compose -f docker/compose/docker-compose.yml -f docker/compose/docker-compose.override.yml up -d
```

To run tests:

```bash
docker-compose -f docker/compose/docker-compose.yml -f docker/compose/docker-compose.test.yml up -d
```

To run with monitoring:

```bash
docker-compose -f docker/compose/docker-compose.yml -f docker/compose/docker-compose.monitoring.yml up -d
```

### Switching Between Local and Official Images

To switch to local images:

```bash
./docker/scripts/switch-local.sh
```

To switch to quick local build:

```bash
./docker/scripts/switch-local.sh quick
```

To switch back to official images:

```bash
./docker/scripts/switch-official.sh
```

## Adding a New Service

1. Create a new directory in `services/` for your service
2. Create a Dockerfile based on the template in `templates/`
3. Add the service to the Docker Compose files in `compose/`
4. Update the build scripts if necessary
5. Run the linting script to ensure your Dockerfile follows best practices:
   ```bash
   ./docker/scripts/lint-dockerfiles.sh
   ```

## Best Practices

1. **Use multi-stage builds**: All Dockerfiles should use multi-stage builds to separate build and runtime environments.
2. **Pin package versions**: Always pin package versions in `apt-get install` and `apk add` commands.
3. **Use non-root users**: Create and use non-root users for running applications.
4. **Minimize image size**: Only include necessary files and dependencies in the final image.
5. **Add health checks**: Include health checks for all services to enable proper orchestration.
6. **Validate configurations**: Always validate Docker Compose configurations before building:
   ```bash
   docker-compose -f docker/compose/docker-compose.yml config --quiet
   ```
7. **Lint Dockerfiles**: Regularly lint Dockerfiles to catch common anti-patterns.
8. **Keep Dockerfiles close to code**: Place Dockerfiles in the same directory as the service code to avoid accidentally omitting files.
9. **Always include COPY . .**: Ensure all necessary files are copied to the Docker image, especially custom build scripts.
10. **Test builds locally first**: Run `npm run update-plugins && npm run prisma-generate` locally before Dockerizing to catch any missing dependencies.
11. **Configure npm for resilience**: Set npm registry, retry settings, and use BuildKit cache for npm downloads to handle flaky networks.

## CI/CD Integration

To integrate Docker linting and validation into your CI/CD pipeline, add the following steps to your workflow:

```yaml
jobs:
  docker-validation:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Install Hadolint
        run: |
          wget -q https://github.com/hadolint/hadolint/releases/latest/download/hadolint-Linux-x86_64
          chmod +x hadolint-Linux-x86_64
          sudo mv hadolint-Linux-x86_64 /usr/local/bin/hadolint

      - name: Lint Dockerfiles
        run: ./docker/scripts/lint-dockerfiles.sh

      - name: Validate Docker Compose files
        run: |
          docker-compose -f docker/compose/docker-compose.yml config --quiet
          docker-compose -f docker/compose/docker-compose.yml -f docker/compose/docker-compose.override.yml config --quiet
          docker-compose -f docker/compose/docker-compose.yml -f docker/compose/docker-compose.test.yml config --quiet
          docker-compose -f docker/compose/docker-compose.yml -f docker/compose/docker-compose.monitoring.yml config --quiet
```

This ensures that all Docker-related files are validated before merging changes.
