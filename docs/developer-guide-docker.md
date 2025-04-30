# Developer's Guide: Running Postiz Docker Image for Testing

This guide explains how to use the Postiz Docker image to test the entire project in a development environment.

## Testing Options

You have three options for testing with Docker:

1. **Using the official image**: Use the pre-built `ghcr.io/gitroomhq/postiz-app` image from GitHub Container Registry
   - Quick to set up
   - Does NOT include your local code modifications
   - Good for testing the stable version

2. **Using a standard local build**: Build a local image with your code modifications
   - Includes all your local changes
   - Takes longer to set up (build time)
   - Recommended for testing your code modifications in a production-like environment

3. **Using a quick local build**: Build a simplified local image with your code modifications
   - Includes all your local changes
   - Much faster build time
   - Good for rapid testing during development
   - May not work exactly like production

For testing with your local code modifications, see the [Using a Custom Build with Your Code Modifications](#using-a-custom-build-with-your-code-modifications) section.

### Helper Scripts for Switching Between Images

We've provided helper scripts to easily switch between the official image and your local images:

- To switch to your standard local build:
  ```bash
  ./var/docker/switch-to-local.sh
  ```

- To switch to your quick local build:
  ```bash
  ./var/docker/switch-to-local.sh quick
  ```

- To switch back to the official image:
  ```bash
  ./var/docker/switch-to-official.sh
  ```

These scripts will update your docker-compose.yml file automatically.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine
- Basic understanding of Docker and containerization
- At least 4GB of RAM and 2 vCPUs available for Docker

## Important Notes

⚠️ **Warning:** The current ARM or AMD images do not work correctly in versions newer than v1.36.1. The latest working versions are:
- `v1.36.1-arm64` (for ARM architecture)
- `v1.36.1-amd64` (for AMD architecture)

## Step 1: Create a docker-compose.yml file

Create a new file named `docker-compose.yml` in your project root with the following content:

```yaml
services:
  postiz:
    image: ghcr.io/gitroomhq/postiz-app:v1.36.1-amd64  # Use v1.36.1-arm64 for ARM-based systems
    container_name: postiz
    restart: always
    environment:
      # Replace postiz.localhost with your preferred local domain
      MAIN_URL: "http://postiz.localhost"
      FRONTEND_URL: "http://postiz.localhost"
      NEXT_PUBLIC_BACKEND_URL: "http://postiz.localhost/api"
      JWT_SECRET: "dev-jwt-secret-replace-in-production"

      # Database and Redis configuration
      DATABASE_URL: "postgresql://postiz-user:postiz-password@postiz-postgres:5432/postiz-db-local"
      REDIS_URL: "redis://postiz-redis:6379"
      BACKEND_INTERNAL_URL: "http://localhost:3000"

      # Required for self-hosting
      IS_GENERAL: "true"

      # Local storage configuration
      STORAGE_PROVIDER: "local"
      UPLOAD_DIRECTORY: "/uploads"
      NEXT_PUBLIC_UPLOAD_DIRECTORY: "/uploads"

      # For development environments only - disables secure cookie requirements
      NOT_SECURED: "true"
    volumes:
      - postiz-config:/config/
      - postiz-uploads:/uploads/
    ports:
      - 5000:5000
    networks:
      - postiz-network
    depends_on:
      postiz-postgres:
        condition: service_healthy
      postiz-redis:
        condition: service_healthy

  postiz-postgres:
    image: postgres:17-alpine
    container_name: postiz-postgres
    restart: always
    environment:
      POSTGRES_PASSWORD: postiz-password
      POSTGRES_USER: postiz-user
      POSTGRES_DB: postiz-db-local
    volumes:
      - postgres-volume:/var/lib/postgresql/data
    networks:
      - postiz-network
    healthcheck:
      test: pg_isready -U postiz-user -d postiz-db-local
      interval: 10s
      timeout: 3s
      retries: 3

  postiz-redis:
    image: redis:7.2
    container_name: postiz-redis
    restart: always
    healthcheck:
      test: redis-cli ping
      interval: 10s
      timeout: 3s
      retries: 3
    volumes:
      - postiz-redis-data:/data
    networks:
      - postiz-network

volumes:
  postgres-volume:
    external: false
  postiz-redis-data:
    external: false
  postiz-config:
    external: false
  postiz-uploads:
    external: false

networks:
  postiz-network:
    external: false
```

## Step 2: Start the Postiz Stack

Run the following command to start all services:

```bash
docker compose up -d
```

This will start:
- The Postiz application container
- PostgreSQL database
- Redis instance

## Step 3: Access the Application

Once all containers are running, you can access the Postiz web interface at:

```
http://localhost:5001
```

Note: The default port is 5001 to avoid conflicts with other services that might be using port 5000. If you need to use a different port, you can modify the `ports` section in the docker-compose.yml file:

```yaml
ports:
  - 5001:5000  # Change 5001 to your preferred port
```

## Step 4: Monitor Logs

To monitor the logs of the Postiz container:

```bash
docker logs -f postiz
```

## Step 5: Testing the Application

1. **Create an account**: Navigate to http://localhost:5000 and create a new account
2. **Test social media integrations**: Configure and test connections to social media platforms
3. **Test scheduling**: Create and schedule posts to verify the core functionality

## Controlling Specific Services

You can control which services run in the Postiz container by setting the `POSTIZ_APPS` environment variable:

- Frontend only: `POSTIZ_APPS="frontend"`
- Backend only: `POSTIZ_APPS="backend"`
- Worker and Cron only: `POSTIZ_APPS="worker cron"`

Example:
```yaml
services:
  postiz:
    # ... other configuration
    environment:
      # ... other environment variables
      POSTIZ_APPS: "frontend backend"
```

## Troubleshooting

### Container fails to start

Check the logs for errors:
```bash
docker logs postiz
```

### Database connection issues

Verify the PostgreSQL container is running:
```bash
docker ps | grep postiz-postgres
```

Check PostgreSQL logs:
```bash
docker logs postiz-postgres
```

### Redis connection issues

Verify the Redis container is running:
```bash
docker ps | grep postiz-redis
```

Check Redis logs:
```bash
docker logs postiz-redis
```

### Resetting the environment

To completely reset your development environment:

```bash
# Stop all containers
docker compose down

# Remove volumes
docker volume rm postgres-volume postiz-redis-data postiz-config postiz-uploads

# Start fresh
docker compose up -d
```

## Advanced Configuration

For advanced configuration options, refer to the [Postiz Configuration Reference](https://docs.postiz.com/configuration/reference).

## Using a Custom Build with Your Code Modifications

To test your local code modifications in a Docker environment, you need to build a local Docker image that includes all your changes. You have two options for building a local image:

### Option 1: Standard Build (Production-like)

1. Build the local image using the provided script:
   ```bash
   ./var/docker/docker-build.sh
   ```

   This script:
   - Removes any existing `localhost/postiz` image
   - Builds a new image using your local code
   - Tags it as `localhost/postiz`
   - Uses the `dist` target in the Dockerfile.dev

   Note: The build process may take several minutes as it needs to install dependencies and build all the projects.

2. Update your docker-compose.yml to use the local image:
   ```bash
   ./var/docker/switch-to-local.sh
   ```

### Option 2: Quick Build (Faster Development)

If you're finding that the standard build is taking too long or getting stuck, you can use the quick build option:

1. Build the quick local image:
   ```bash
   ./var/docker/docker-build-quick.sh
   ```

   This script:
   - Creates a simplified Dockerfile that just copies your source code
   - Builds a new image using your local code
   - Tags it as `localhost/postiz-quick`
   - Skips the lengthy npm install and build steps

   Note: This build is much faster but may not work exactly like production.

2. Update your docker-compose.yml to use the quick local image:
   ```bash
   ./var/docker/switch-to-local.sh quick
   ```

### Running and Testing

After building either image type:

1. Start the containers with your local image:
   ```bash
   docker compose up -d
   ```

2. Verify your changes are included in the running container:
   ```bash
   # Check logs to see if your changes are working
   docker logs -f postiz

   # Or connect to the container to inspect files
   docker exec -it postiz /bin/bash
   ```

3. If you make additional code changes, rebuild the image and restart the containers:
   ```bash
   # Rebuild the image (standard or quick)
   ./var/docker/docker-build.sh
   # OR
   ./var/docker/docker-build-quick.sh

   # Restart the containers with the new image
   docker compose down
   docker compose up -d
   ```

## Integration with Other Services

### Keycloak Integration

To test with Keycloak authentication, refer to the `docker-compose.keycloak.yml` file in the project and the onesso integration documentation.

### Development Tools

For development, you might want to add additional services:

```yaml
services:
  # ... other services

  postiz-pg-admin:
    image: dpage/pgadmin4:latest
    container_name: postiz-pg-admin
    restart: always
    ports:
      - 8081:80
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin
    networks:
      - postiz-network

  postiz-redisinsight:
    image: redis/redisinsight:latest
    container_name: postiz-redisinsight
    ports:
      - "5540:5540"
    volumes:
      - redisinsight:/data
    networks:
      - postiz-network
    restart: always
```

## Further Resources

- [Official Postiz Documentation](https://docs.postiz.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
