# onesso Authentication Service

## Overview

onesso is a centralized authentication service built on Keycloak, designed to provide secure, scalable, and flexible authentication for all applications in the ecosystem. This repository contains the implementation of the onesso service, integration libraries, and documentation.

## Repository Structure

- `apps/onesso`: The onesso microservice implementation
- `keycloak`: Keycloak configuration and initialization scripts
- `scripts`: Migration and utility scripts
- `docs`: Documentation and guides

## Documentation

- [Implementation Plan](docs/onesso-implementation-plan.md): Detailed plan for implementing the onesso service
- [Executive Summary](docs/onesso-executive-summary.md): Summary of the implementation, security posture, and rollout plan
- [Frontend Integration Guide](docs/frontend-integration-guide.md): Guide for integrating with Next.js and other frontend frameworks
- [Backend Integration Guide](docs/backend-integration-guide.md): Guide for integrating with NestJS and other backend frameworks
- [Authentication Flow](docs/auth-flow-sequence-diagram.md): Sequence diagrams illustrating the authentication flow

## Getting Started

### Prerequisites

- Node.js 18 or later
- Docker and Docker Compose
- PostgreSQL database

### Installation

1. Clone the repository
2. Copy the example environment file:
   ```bash
   cp apps/onesso/.env.example apps/onesso/.env
   ```
3. Update the environment variables in the `.env` file
4. Start the services using Docker Compose:
   ```bash
   docker-compose -f docker-compose.keycloak.yml up -d
   ```

### Development

To run the service in development mode:

```bash
cd apps/onesso
npm install
npm run start:dev
```

### Testing

The onesso service includes comprehensive testing:

#### Unit Tests

```bash
cd apps/onesso
npm test
```

#### Integration Tests

```bash
cd apps/onesso
npm run test:e2e
```

#### Security Tests

```bash
cd apps/onesso
npm run test:security
```

#### All Tests

```bash
cd apps/onesso
npm run test:all
```

For more information, see the [Testing Strategy](docs/testing-strategy.md) and [Security Considerations](docs/security-considerations.md) documents.

## Migration

To migrate users from the existing authentication system to onesso, use the migration script:

```bash
node scripts/migrate-users-to-keycloak.js
```

## Security Considerations

- Always use HTTPS in production
- Keep Keycloak and onesso service updated with the latest security patches
- Use strong passwords for admin accounts
- Enable MFA for administrative access
- Regularly review authentication logs for suspicious activity

## License

This project is licensed under the MIT License - see the LICENSE file for details.
