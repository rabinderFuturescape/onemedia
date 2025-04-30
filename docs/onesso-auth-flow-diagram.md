# onesso Authentication Flow Diagram

This document provides a visual representation of the authentication flows in the onesso authentication service, which is built on Keycloak and provides centralized authentication for all applications in the ecosystem.

## Overview

The onesso authentication service acts as a bridge between client applications and Keycloak, providing a seamless authentication experience while maintaining compatibility with existing systems. The service supports various authentication methods, including:

- Username/password authentication
- Social login (OAuth providers)
- Multi-factor authentication (MFA)
- API key authentication

## Authentication Flows

### Standard Login Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend Application
    participant NextAuth as NextAuth.js
    participant Onesso as onesso Service
    participant Keycloak
    participant Database

    User->>Frontend: Initiates login
    Frontend->>NextAuth: Calls signIn('onesso')
    NextAuth->>Onesso: GET /api/nextauth/.well-known/openid-configuration
    Onesso->>Keycloak: Fetches OIDC configuration
    Keycloak->>Onesso: Returns OIDC configuration
    Onesso->>NextAuth: Returns OIDC configuration
    NextAuth->>Frontend: Redirects to Keycloak login page
    Frontend->>User: Shows Keycloak login page
    User->>Keycloak: Enters credentials
    Keycloak->>Database: Validates credentials
    Database->>Keycloak: Confirms user exists
    Keycloak->>Frontend: Redirects with authorization code
    Frontend->>NextAuth: Processes callback with code
    NextAuth->>Onesso: Exchanges code for tokens
    Onesso->>Keycloak: Exchanges code for tokens
    Keycloak->>Onesso: Returns access & refresh tokens
    Onesso->>NextAuth: Returns tokens and user profile
    NextAuth->>Frontend: Creates session with user info
    Frontend->>User: Shows authenticated UI
```

### Direct API Authentication Flow

```mermaid
sequenceDiagram
    participant Client as Client Application
    participant Onesso as onesso Service
    participant Keycloak
    participant Database

    Client->>Onesso: POST /auth/login with credentials
    Onesso->>Keycloak: Validates credentials
    Keycloak->>Database: Checks user credentials
    Database->>Keycloak: Confirms user exists
    Keycloak->>Onesso: Returns tokens if valid
    Onesso->>Onesso: Generates compatible JWT
    Onesso->>Client: Returns tokens & sets auth cookie
    Client->>Client: Stores tokens for future requests
```

### Social Login Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend Application
    participant NextAuth as NextAuth.js
    participant Onesso as onesso Service
    participant Keycloak
    participant SocialProvider as Social Provider (Google, GitHub, etc.)

    User->>Frontend: Clicks social login button
    Frontend->>NextAuth: Calls signIn('onesso')
    NextAuth->>Onesso: GET /api/nextauth/.well-known/openid-configuration
    Onesso->>Keycloak: Fetches OIDC configuration
    Keycloak->>Onesso: Returns OIDC configuration
    Onesso->>NextAuth: Returns OIDC configuration
    NextAuth->>Frontend: Redirects to Keycloak
    Frontend->>Keycloak: Redirects to Keycloak
    Keycloak->>User: Shows login options with social providers
    User->>Keycloak: Selects social provider
    Keycloak->>SocialProvider: Redirects to social provider
    User->>SocialProvider: Authenticates with social provider
    SocialProvider->>Keycloak: Redirects with authorization code
    Keycloak->>SocialProvider: Exchanges code for tokens
    SocialProvider->>Keycloak: Returns user info and tokens
    Keycloak->>Frontend: Redirects with authorization code
    Frontend->>NextAuth: Processes callback with code
    NextAuth->>Onesso: Exchanges code for tokens
    Onesso->>Keycloak: Exchanges code for tokens
    Keycloak->>Onesso: Returns access & refresh tokens
    Onesso->>NextAuth: Returns tokens and user profile
    NextAuth->>Frontend: Creates session with user info
    Frontend->>User: Shows authenticated UI
```

### Token Validation Flow

```mermaid
sequenceDiagram
    participant Client as Client Application
    participant API as API Service
    participant Onesso as onesso Service
    participant Keycloak

    Client->>API: Request with access token
    API->>Onesso: Validate token
    Onesso->>Keycloak: Introspect token
    Keycloak->>Onesso: Token validation result
    Onesso->>API: User information if valid
    API->>Client: Protected resource or 401 Unauthorized
```

### Token Refresh Flow

```mermaid
sequenceDiagram
    participant Client as Client Application
    participant NextAuth as NextAuth.js
    participant Onesso as onesso Service
    participant Keycloak

    Client->>NextAuth: Session expires or token refresh needed
    NextAuth->>Onesso: POST /api/nextauth/refresh with refresh token
    Onesso->>Keycloak: Request new tokens
    Keycloak->>Onesso: Returns new access & refresh tokens
    Onesso->>Onesso: Generates compatible JWT
    Onesso->>NextAuth: Returns new tokens
    NextAuth->>Client: Updates session with new tokens
```

### Logout Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend Application
    participant NextAuth as NextAuth.js
    participant Onesso as onesso Service
    participant Keycloak

    User->>Frontend: Initiates logout
    Frontend->>NextAuth: Calls signOut()
    NextAuth->>Onesso: POST /api/nextauth/logout
    Onesso->>Keycloak: Invalidates session
    Keycloak->>Onesso: Confirms logout
    Onesso->>NextAuth: Returns logout confirmation
    NextAuth->>Frontend: Clears session
    Frontend->>User: Shows unauthenticated UI
```

### Multi-Tenant Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend Application
    participant NextAuth as NextAuth.js
    participant Onesso as onesso Service
    participant Keycloak
    participant TenantDB as Tenant Database

    User->>Frontend: Initiates login with tenant selection
    Frontend->>NextAuth: Calls signIn('onesso', { tenant: 'tenant1' })
    NextAuth->>Onesso: GET /api/nextauth/.well-known/openid-configuration
    Onesso->>Keycloak: Fetches OIDC configuration
    Keycloak->>Onesso: Returns OIDC configuration
    Onesso->>NextAuth: Returns OIDC configuration
    NextAuth->>Frontend: Redirects to Keycloak with tenant info
    Frontend->>Keycloak: Redirects with tenant parameter
    User->>Keycloak: Enters credentials
    Keycloak->>TenantDB: Validates credentials & tenant access
    TenantDB->>Keycloak: Confirms user has access to tenant
    Keycloak->>Frontend: Redirects with authorization code
    Frontend->>NextAuth: Processes callback with code
    NextAuth->>Onesso: Exchanges code for tokens
    Onesso->>Keycloak: Exchanges code for tokens
    Keycloak->>Onesso: Returns tokens with tenant claim
    Onesso->>NextAuth: Returns tokens and user profile with tenant info
    NextAuth->>Frontend: Creates session with user and tenant info
    Frontend->>User: Shows tenant-specific UI
```

## Backend Integration Flow

```mermaid
sequenceDiagram
    participant Client as Client Application
    participant API as API Service
    participant JwtGuard as JWT Auth Guard
    participant Onesso as onesso Service
    participant Keycloak

    Client->>API: Request with Bearer token
    API->>JwtGuard: Intercepts request
    JwtGuard->>Onesso: Validates token
    Onesso->>Keycloak: Introspects token
    Keycloak->>Onesso: Returns token validity and claims
    Onesso->>JwtGuard: Returns user information
    JwtGuard->>API: Attaches user to request
    API->>API: Checks permissions
    API->>Client: Returns response
```

## Registration Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend Application
    participant Onesso as onesso Service
    participant Keycloak
    participant Email as Email Service

    User->>Frontend: Fills registration form
    Frontend->>Onesso: POST /auth/register
    Onesso->>Keycloak: Creates user
    Keycloak->>Onesso: Returns user ID
    alt Email Verification Required
        Onesso->>Email: Sends verification email
        Email->>User: Delivers verification email
        User->>Frontend: Clicks verification link
        Frontend->>Onesso: GET /auth/verify-email
        Onesso->>Keycloak: Verifies email
        Keycloak->>Onesso: Confirms verification
        Onesso->>Frontend: Returns verification status
        Frontend->>User: Shows verification success
    else Auto-Activation
        Onesso->>Frontend: Returns registration success
        Frontend->>User: Shows login prompt
    end
```

## Complete System Architecture

```mermaid
graph TD
    subgraph "Client Applications"
        NextApp[Next.js App]
        ReactApp[React App]
        FlutterApp[Flutter App]
        MobileApp[Mobile App]
    end

    subgraph "API Gateway"
        Kong[Kong API Gateway]
    end

    subgraph "Backend Services"
        API1[API Service 1]
        API2[API Service 2]
        API3[API Service 3]
    end

    subgraph "onesso Service"
        OnessoAPI[onesso API]
        NextAuthAdapter[NextAuth Adapter]
        TokenService[Token Service]
        UserService[User Service]
    end

    subgraph "Keycloak"
        KeycloakServer[Keycloak Server]
        IdentityProviders[Identity Providers]
        UserFederation[User Federation]
    end

    subgraph "Databases"
        KeycloakDB[(Keycloak DB)]
        AppDB[(Application DB)]
    end

    NextApp --> Kong
    ReactApp --> Kong
    FlutterApp --> Kong
    MobileApp --> Kong

    Kong --> API1
    Kong --> API2
    Kong --> API3
    Kong --> OnessoAPI

    API1 --> OnessoAPI
    API2 --> OnessoAPI
    API3 --> OnessoAPI

    OnessoAPI --> NextAuthAdapter
    OnessoAPI --> TokenService
    OnessoAPI --> UserService

    NextAuthAdapter --> KeycloakServer
    TokenService --> KeycloakServer
    UserService --> KeycloakServer

    KeycloakServer --> IdentityProviders
    KeycloakServer --> UserFederation
    KeycloakServer --> KeycloakDB

    API1 --> AppDB
    API2 --> AppDB
    API3 --> AppDB
```

These diagrams illustrate the key authentication flows and system architecture in the onesso authentication service. The service acts as a bridge between client applications and Keycloak, providing a seamless authentication experience while maintaining compatibility with existing systems.
