# onesso Authentication Flow Sequence Diagram

The following sequence diagram illustrates the authentication flow between the client application, onesso service, and Keycloak.

## Login Flow

```mermaid
sequenceDiagram
    participant User
    participant Client as Client Application
    participant Onesso as onesso Service
    participant Keycloak
    participant Database

    User->>Client: Initiates login
    Client->>Onesso: GET /auth/login/oauth
    Onesso->>Client: Returns Keycloak login URL
    Client->>User: Redirects to Keycloak login page
    User->>Keycloak: Enters credentials
    Keycloak->>Database: Validates credentials
    Database->>Keycloak: Confirms user exists
    Keycloak->>User: Redirects back to client with auth code
    User->>Client: Redirects with auth code
    Client->>Onesso: POST /auth/callback with auth code
    Onesso->>Keycloak: Exchanges code for tokens
    Keycloak->>Onesso: Returns access & refresh tokens
    Onesso->>Onesso: Generates compatible JWT
    Onesso->>Client: Returns tokens & sets auth cookie
    Client->>User: Shows authenticated UI
```

## Token Validation Flow

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

## Token Refresh Flow

```mermaid
sequenceDiagram
    participant Client as Client Application
    participant Onesso as onesso Service
    participant Keycloak

    Client->>Onesso: POST /auth/refresh with refresh token
    Onesso->>Keycloak: Request new tokens
    Keycloak->>Onesso: Returns new access & refresh tokens
    Onesso->>Onesso: Generates compatible JWT
    Onesso->>Client: Returns new tokens & updates auth cookie
```

## Logout Flow

```mermaid
sequenceDiagram
    participant User
    participant Client as Client Application
    participant Onesso as onesso Service
    participant Keycloak

    User->>Client: Initiates logout
    Client->>Onesso: POST /auth/logout
    Onesso->>Client: Returns Keycloak logout URL & clears auth cookie
    Client->>Keycloak: Redirects to Keycloak logout
    Keycloak->>Keycloak: Invalidates session
    Keycloak->>Client: Redirects back to client
    Client->>User: Shows unauthenticated UI
```

## Multi-Tenant Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Client as Client Application
    participant Onesso as onesso Service
    participant Keycloak
    participant TenantDB as Tenant Database

    User->>Client: Initiates login with tenant selection
    Client->>Onesso: GET /auth/login/oauth?tenant=tenant1
    Onesso->>Client: Returns Keycloak login URL with tenant info
    Client->>User: Redirects to Keycloak login page
    User->>Keycloak: Enters credentials
    Keycloak->>TenantDB: Validates credentials & tenant access
    TenantDB->>Keycloak: Confirms user has access to tenant
    Keycloak->>User: Redirects back to client with auth code
    User->>Client: Redirects with auth code
    Client->>Onesso: POST /auth/callback with auth code
    Onesso->>Keycloak: Exchanges code for tokens
    Keycloak->>Onesso: Returns access & refresh tokens with tenant claim
    Onesso->>Onesso: Generates compatible JWT with tenant info
    Onesso->>Client: Returns tokens & sets auth cookie
    Client->>User: Shows tenant-specific UI
```

These sequence diagrams illustrate the key authentication flows in the onesso authentication service. The service acts as a bridge between client applications and Keycloak, providing a seamless authentication experience while maintaining compatibility with existing systems.
