# Auth Microservice

This document describes the authentication microservice architecture and implementation details.

## Overview

The Auth Microservice is a standalone service responsible for handling all authentication-related functionality in the Gitroom application. It follows clean architecture and hexagonal structure principles to ensure separation of concerns and maintainability.

## Architecture

The Auth Microservice is built using a hexagonal architecture with the following layers:

1. **Domain Layer**
   - Contains the core business logic and domain models
   - Defines ports (interfaces) for external dependencies

2. **Application Layer**
   - Implements use cases using the domain layer
   - Coordinates between the domain and infrastructure layers

3. **Infrastructure Layer**
   - Implements adapters for external dependencies (database, external services)
   - Provides concrete implementations of the ports defined in the domain layer

4. **API Layer**
   - Exposes REST endpoints for authentication operations
   - Handles HTTP requests and responses

## Authentication Flow

The authentication flow is as follows:

1. Client sends authentication request to the Backend
2. Backend forwards the request to the Auth Microservice
3. Auth Microservice processes the request and returns a response
4. Backend returns the response to the client

For token validation:

1. Backend receives a request with a token
2. Backend sends the token to the Auth Microservice for validation
3. Auth Microservice validates the token and returns user information
4. Backend uses the user information to authorize the request

## Supported Authentication Methods

The Auth Microservice supports the following authentication methods:

- Local (email/password)
- OAuth providers (Google, GitHub, Facebook, Twitter)
- Wallet authentication (Web3)
- API key authentication

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login a user
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/activate/:token` - Activate user account
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user

### OAuth Providers

- `GET /auth/provider/:provider` - Get OAuth provider auth link
- `POST /auth/provider/:provider/callback` - Handle OAuth provider callback

### Token Validation

- `GET /auth/me` - Get current user info (validates token)

## Deployment

The Auth Microservice can be deployed as a standalone service using Docker. A Docker Compose configuration is provided for local development and testing.

### Environment Variables

See `.env.example` for a list of required environment variables.

### Running the Service

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod

# Docker
docker-compose -f docker-compose.auth.yml up
```

## Integration with Backend

The Backend communicates with the Auth Microservice using the `AuthClientService`. This service provides methods for all authentication operations and token validation.

## Security Considerations

- JWT tokens are used for authentication
- Refresh tokens are used for token renewal
- Passwords are hashed using bcrypt
- HTTPS is used for all communication
- Cookies are secure, HTTP-only, and same-site
- Rate limiting is implemented to prevent brute force attacks
