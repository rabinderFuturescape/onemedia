# Developer's Guide: Running the Application with OneSSO Authentication

This guide provides step-by-step instructions for running the application with OneSSO authentication for testing and development purposes.

## Overview

The application uses OneSSO, a centralized authentication service built on Keycloak, to provide secure, scalable, and flexible authentication. This guide will help you set up and run all the necessary components to test the application's authentication flow.

## Authentication Flow

The authentication flow with OneSSO works as follows:

1. User navigates to the application and is redirected to the login page
2. User clicks "Sign in with OneSSO" button
3. User is redirected to the OneSSO login page
4. After successful authentication, OneSSO redirects back to the application with an authorization code
5. The application exchanges the code for access and refresh tokens
6. The application stores the tokens securely and uses them for API requests
7. When the access token expires, the refresh token is used to obtain a new access token
8. If the refresh token expires, the user is redirected to the login page

This flow provides a secure and seamless authentication experience for users while maintaining high security standards.

## Prerequisites

- Node.js 20 or later
- Docker and Docker Compose
- Git repository cloned locally

## Step 1: Start Required Docker Containers

The application requires several Docker containers to run properly:

1. **Keycloak**: The identity and access management server
2. **PostgreSQL for Keycloak**: Database for Keycloak
3. **Mock OneSSO service**: A service that wraps Keycloak functionality
4. **PostgreSQL for the application**: Database for the application
5. **Redis**: For caching and session management
6. **Frontend**: Next.js application
7. **Backend**: NestJS API server

Start all these containers using the provided docker-compose file:

```bash
docker-compose up -d
```

This command will start all the required containers. You can verify they're running with:

```bash
docker ps
```

You should see containers for:
- keycloak
- keycloak-postgres
- mock-onesso
- postiz-postgres
- postiz-redis
- postiz-static
- postiz-frontend
- postiz-backend

For production environments, you can use the production Docker Compose file:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

This will start the containers with production-optimized settings.

## Step 2: Run the Node Server

Once all the Docker containers are running, you can start the application's node server:

```bash
npm run dev
```

This command runs the frontend, backend, and workers in parallel using the nx build system. The output should show that all three projects are starting:

```
NX   Running target serve for 3 projects:

- frontend
- backend
- workers
```

When the server is ready, you'll see:

```
✓ Ready in X.Xs
```

The application will be available at:
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000
- onesso service: http://localhost:3002
- Keycloak: http://localhost:8080/auth

## Step 3: Access the Dashboard through onesso

To access the dashboard through onesso authentication:

1. Navigate to http://localhost:4200 in your browser
2. You should be redirected to the login page
3. Log in with your credentials
4. After successful authentication, you will be redirected to the dashboard

## Keycloak Administration

If you need to log in to the Keycloak admin console:

1. Go to http://localhost:8080/auth/admin/
2. Use the following credentials:
   - Username: admin
   - Password: admin (as specified in the docker-compose.yml file)

From the admin console, you can:
- Create and manage users
- Configure authentication flows
- Set up identity providers
- Manage client applications
- Configure roles and permissions

## Troubleshooting

If you encounter any issues with authentication, you can check:

1. **Mock onesso container logs**:
   ```bash
   docker logs mock-onesso
   ```

2. **Keycloak container logs**:
   ```bash
   docker logs keycloak
   ```

3. **Browser console** for any frontend errors

4. **Node server logs** in the terminal where you ran `npm run dev`

### Common Issues

1. **Cannot access Keycloak**: Make sure the Keycloak container is running and healthy:
   ```bash
   docker ps | grep keycloak
   ```

2. **Authentication fails**: Check that the environment variables in `.env` match the configuration in Keycloak:
   ```bash
   cat .env | grep KEYCLOAK
   ```

3. **Redirect errors**: Ensure that the `FRONTEND_URL` and `ALLOWED_ORIGINS` in the onesso service configuration include your frontend URL.

## Environment Configuration

The application uses several environment variables for configuration. The most important ones for authentication are:

```
# OneSSO Configuration
ONESSO_URL=http://localhost:3002
ONESSO_CLIENT_ID=postiz-client
ONESSO_CLIENT_SECRET=postiz-secret
ONESSO_REDIRECT_URI=http://localhost:4200/auth/callback

# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8080/auth
KEYCLOAK_REALM=onesso
KEYCLOAK_CLIENT_ID=onesso-admin
KEYCLOAK_CLIENT_SECRET=postiz-secret

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:4200
NEXTAUTH_SECRET=onesso-nextauth-secret

# Frontend Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000/api
NEXT_PUBLIC_ONESSO_URL=http://localhost:3002

# Backend Configuration
BACKEND_URL=http://postiz-backend:3000/api
BACKEND_INTERNAL_URL=http://postiz-backend:3000/api
FRONTEND_URL=http://localhost:4200
JWT_SECRET=onesso-jwt-secret
```

These should be configured in your `.env` file at the root of the project. For Docker environments, these variables are set in the Docker Compose files.

## Stopping the Application

To stop the application:

1. Press `Ctrl+C` in the terminal where the node server is running
2. Stop the Docker containers:
   ```bash
   docker compose down
   ```

## Monitoring and Debugging

For monitoring the application, you can use the included Prometheus and Grafana stack:

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

This will start:
- Prometheus for metrics collection
- Grafana for visualization
- AlertManager for alerts
- Node Exporter for host metrics
- cAdvisor for container metrics
- Postgres Exporter for PostgreSQL metrics
- Redis Exporter for Redis metrics

You can access the monitoring dashboards at:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (default credentials: admin/admin)

## Next Steps

After successfully running the application with OneSSO authentication, you might want to:

1. Explore the [Frontend Integration Guide](./frontend-integration-guide.md) for details on how the frontend integrates with OneSSO
2. Check the [Backend Integration Guide](./backend-integration-guide.md) for information on how the backend validates authentication
3. Review the [Authentication Flow Sequence Diagram](./auth-flow-sequence-diagram.md) to understand the authentication process
4. Explore the [API Documentation](http://localhost:3000/api/docs) to understand the available endpoints
5. Check the [Folder Structure Guide](../FOLDER_STRUCTURE.md) to understand the codebase organization

## Additional Resources

- [OneSSO Authentication Service README](../apps/onesso/README.md)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [NextAuth.js Documentation](https://next-auth.js.org/getting-started/introduction)
- [Docker Documentation](https://docs.docker.com/)
- [Prometheus Documentation](https://prometheus.io/docs/introduction/overview/)
- [Grafana Documentation](https://grafana.com/docs/)
