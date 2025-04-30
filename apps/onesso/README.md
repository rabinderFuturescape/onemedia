# onesso Authentication Service

onesso is a centralized authentication service built on Keycloak, providing secure, scalable, and flexible authentication for all applications in the ecosystem.

## Features

- **Centralized Authentication**: Single sign-on across all applications
- **Multi-Tenant Support**: Isolated authentication for different tenants
- **Multiple Authentication Methods**: Username/password, social login, and more
- **Role-Based Access Control**: Fine-grained permissions based on user roles
- **API Key Authentication**: Support for machine-to-machine authentication
- **Comprehensive Logging**: Detailed logs of all authentication events
- **Compatibility Layer**: Works with existing JWT-based authentication

## Getting Started

### Prerequisites

- Node.js 18 or later
- Docker and Docker Compose
- PostgreSQL database

### Installation

1. Clone the repository
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Update the environment variables in the `.env` file
4. Start the services using Docker Compose:
   ```bash
   docker-compose -f docker-compose.keycloak.yml up -d
   ```

### Development

To run the service in development mode:

```bash
npm install
npm run start:dev
```

### Testing

```bash
npm test
```

## Architecture

onesso consists of the following components:

1. **Keycloak Server**: Core identity and access management
2. **onesso Microservice**: NestJS service that wraps Keycloak functionality
3. **Integration Libraries**: Libraries for frontend and backend integration

## API Documentation

API documentation is available at `/api/docs` when the service is running.

## Integration

### Frontend Integration

See the [Frontend Integration Guide](../../docs/frontend-integration-guide.md) for details on integrating with Next.js and other frontend frameworks.

### Backend Integration

See the [Backend Integration Guide](../../docs/backend-integration-guide.md) for details on integrating with NestJS and other backend frameworks.

## Authentication Flow

See the [Authentication Flow Sequence Diagram](../../docs/auth-flow-sequence-diagram.md) for a visual representation of the authentication flow.

## Migration

To migrate users from the existing authentication system to onesso, use the migration script:

```bash
node ../../scripts/migrate-users-to-keycloak.js
```

## Security Considerations

- Always use HTTPS in production
- Keep Keycloak and onesso service updated with the latest security patches
- Use strong passwords for admin accounts
- Enable MFA for administrative access
- Regularly review authentication logs for suspicious activity

## License

This project is licensed under the MIT License - see the LICENSE file for details.
