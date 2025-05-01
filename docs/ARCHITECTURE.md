# Postiz Architecture Overview

This document provides an overview of the Postiz application architecture, including the key components, data flow, and design patterns.

## System Architecture

Postiz follows a microservices architecture with the following components:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Next.js        │     │  NestJS         │     │  OneSSO         │
│  Frontend       │◄────┤  Backend        │◄────┤  (Keycloak)     │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  PostgreSQL     │     │  Redis          │     │  Monitoring     │
│  Database       │     │  Cache          │     │  Stack          │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Key Components

1. **Frontend (Next.js)**
   - Server-side rendered React application
   - NextAuth.js for authentication
   - SWR for data fetching and caching
   - Tailwind CSS for styling
   - TypeScript for type safety

2. **Backend (NestJS)**
   - RESTful API endpoints
   - JWT authentication
   - Role-based access control
   - Prisma ORM for database access
   - BullMQ for background jobs
   - TypeScript for type safety

3. **Authentication (OneSSO/Keycloak)**
   - Identity and access management
   - OAuth 2.0 and OpenID Connect
   - Social login integration
   - Multi-factor authentication
   - User management

4. **Database (PostgreSQL)**
   - Relational database for structured data
   - Prisma migrations for schema management
   - Indexes for query optimization
   - Connection pooling for performance

5. **Caching (Redis)**
   - Session storage
   - API response caching
   - Background job queue
   - Pub/sub for real-time updates

6. **Monitoring (Prometheus/Grafana)**
   - System metrics collection
   - Application metrics collection
   - Visualization dashboards
   - Alerting for critical issues

## Data Flow

### Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│         │  1  │         │  2  │         │  3  │         │
│ Browser │────►│ Next.js │────►│ OneSSO  │────►│ Browser │
│         │     │         │     │         │     │         │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
     ▲               ▲               │               │
     │               │               │               │
     │ 6             │ 5             │ 4             │
     └───────────────┴───────────────┴───────────────┘
```

1. User navigates to the application and is redirected to the login page
2. User clicks "Sign in with OneSSO" button and is redirected to OneSSO
3. OneSSO authenticates the user and redirects back to the application with an authorization code
4. The application exchanges the code for access and refresh tokens
5. The application stores the tokens securely and uses them for API requests
6. The user is redirected to the dashboard

### API Request Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│         │  1  │         │  2  │         │  3  │         │
│ Browser │────►│ Next.js │────►│ NestJS  │────►│ Prisma  │
│         │     │         │     │         │     │         │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
     ▲               ▲               ▲               │
     │               │               │               │
     │ 6             │ 5             │ 4             │
     └───────────────┴───────────────┴───────────────┘
```

1. User interacts with the UI, triggering an API request
2. Next.js forwards the request to the NestJS backend with authentication tokens
3. NestJS validates the request and queries the database using Prisma
4. Prisma executes the query and returns the results
5. NestJS processes the results and returns a response
6. Next.js renders the updated UI with the new data

## Design Patterns

Postiz follows several design patterns to ensure maintainability, scalability, and testability:

### Clean Architecture

The application follows clean architecture principles, separating concerns into layers:

- **Presentation Layer**: UI components and controllers
- **Domain Layer**: Business logic and entities
- **Data Layer**: Data access and persistence

### Hexagonal Architecture

The backend follows hexagonal architecture principles:

- **Core**: Business logic and domain models
- **Ports**: Interfaces defining how the core interacts with the outside world
- **Adapters**: Implementations of the ports for specific technologies

### Repository Pattern

Data access is abstracted through repositories:

- **Repository Interfaces**: Define data access methods
- **Repository Implementations**: Implement data access using Prisma
- **Service Layer**: Uses repositories to access data

### Dependency Injection

Both frontend and backend use dependency injection:

- **NestJS Providers**: Services, repositories, and other dependencies
- **React Context**: For state management and dependency injection in the frontend

### Event-Driven Architecture

Some parts of the application use event-driven architecture:

- **BullMQ**: For asynchronous job processing
- **Redis Pub/Sub**: For real-time updates
- **Event Emitters**: For decoupled communication between components

## Deployment Architecture

Postiz can be deployed in various environments:

### Docker Deployment

```
┌─────────────────────────────────────────────────────────┐
│                      Docker Host                        │
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │         │  │         │  │         │  │         │     │
│  │ Frontend│  │ Backend │  │ OneSSO  │  │ Postgres│     │
│  │         │  │         │  │         │  │         │     │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │         │  │         │  │         │  │         │     │
│  │ Redis   │  │ Prom.   │  │ Grafana │  │ Alert   │     │
│  │         │  │         │  │         │  │ Manager │     │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Kubernetes Deployment

```
┌─────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                   │
│                                                         │
│  ┌─────────────────┐       ┌─────────────────┐          │
│  │  Frontend Pods  │       │  Backend Pods   │          │
│  │  ┌─────┐ ┌─────┐│       │  ┌─────┐ ┌─────┐│          │
│  │  │Pod 1│ │Pod 2││       │  │Pod 1│ │Pod 2││          │
│  │  └─────┘ └─────┘│       │  └─────┘ └─────┘│          │
│  └─────────────────┘       └─────────────────┘          │
│                                                         │
│  ┌─────────────────┐       ┌─────────────────┐          │
│  │  Database       │       │  Redis          │          │
│  │  ┌─────┐ ┌─────┐│       │  ┌─────┐ ┌─────┐│          │
│  │  │Master│ │Slave││       │  │Master│ │Slave││          │
│  │  └─────┘ └─────┘│       │  └─────┘ └─────┘│          │
│  └─────────────────┘       └─────────────────┘          │
│                                                         │
│  ┌─────────────────┐       ┌─────────────────┐          │
│  │  Ingress        │       │  Monitoring     │          │
│  │  Controller     │       │  Stack          │          │
│  └─────────────────┘       └─────────────────┘          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Security Architecture

Postiz implements several security measures:

1. **Authentication**: JWT tokens with short expiration and refresh token rotation
2. **Authorization**: Role-based access control with fine-grained permissions
3. **Data Protection**: HTTPS for all communications, encryption for sensitive data
4. **Input Validation**: Zod/Joi for schema validation, sanitization for user inputs
5. **Rate Limiting**: Tiered rate limiting based on user role, IP-based restrictions
6. **Content Security Policy**: Strict CSP headers to prevent XSS attacks
7. **CSRF Protection**: CSRF tokens for form submissions
8. **Secure Headers**: Various security headers for browser protection

## Performance Optimization

Postiz includes several performance optimizations:

1. **API Caching**: SWR for client-side caching, Redis for server-side caching
2. **Code Splitting**: Dynamic imports for route-based code splitting
3. **Database Optimization**: Indexes for frequently queried fields, query caching
4. **Docker Optimization**: Multi-stage builds, Alpine-based images
5. **Monitoring**: Performance metrics collection and visualization

## Conclusion

The Postiz architecture is designed to be scalable, maintainable, and secure. By following clean architecture principles and using modern technologies, the application can handle complex requirements while remaining flexible for future changes.
