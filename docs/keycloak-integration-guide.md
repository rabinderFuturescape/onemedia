# Keycloak Integration Guide for onesso

This guide provides detailed instructions for configuring Keycloak to work with the onesso authentication service. It covers all required configuration steps and explains the specific Keycloak settings needed for proper integration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Keycloak Server Setup](#keycloak-server-setup)
3. [Realm Configuration](#realm-configuration)
4. [Client Configuration](#client-configuration)
5. [User Federation](#user-federation)
6. [Identity Providers](#identity-providers)
7. [Role Configuration](#role-configuration)
8. [Multi-Tenant Configuration](#multi-tenant-configuration)
9. [Token Settings](#token-settings)
10. [Email Configuration](#email-configuration)
11. [Themes](#themes)
12. [Troubleshooting](#troubleshooting)

## Prerequisites

- Keycloak 22.0.0 or later
- Administrative access to Keycloak
- Docker and Docker Compose (for local development)
- Basic understanding of OAuth 2.0 and OpenID Connect

## Keycloak Server Setup

### Using Docker Compose

The easiest way to set up Keycloak for development is using the provided Docker Compose configuration:

```bash
# Start Keycloak and PostgreSQL
docker-compose -f docker-compose.keycloak.yml up -d
```

This will start:
- PostgreSQL database for Keycloak
- Keycloak server on port 8080
- onesso service on port 3002

### Manual Installation

If you prefer to install Keycloak manually:

1. Download Keycloak from [keycloak.org](https://www.keycloak.org/downloads)
2. Extract the archive
3. Start Keycloak:

```bash
bin/kc.[sh|bat] start-dev
```

4. Access the admin console at http://localhost:8080/auth/admin
5. Log in with the default credentials (admin/admin)

## Realm Configuration

A realm in Keycloak is a space where you manage users, credentials, roles, and groups. The onesso service requires a dedicated realm.

### Creating the onesso Realm

1. Log in to the Keycloak Admin Console
2. Click "Add realm" in the top-left dropdown menu
3. Enter "onesso" as the Name
4. Click "Create"

### Required Realm Settings

Navigate to "Realm Settings" and configure the following:

#### General Settings

- **Display name**: onesso Authentication
- **HTML Display name**: `<div class="kc-logo-text"><span>onesso</span></div>`
- **Frontend URL**: http://localhost:8080/auth/ (adjust for your environment)

#### Login Settings

- **User registration**: Enabled
- **Email as username**: Enabled (recommended)
- **Edit username**: Disabled
- **Forgot password**: Enabled
- **Remember me**: Enabled
- **Verify email**: Enabled
- **Login with email**: Enabled
- **Require SSL**: External requests

#### Token Settings

- **Default Signature Algorithm**: RS256
- **Access Token Lifespan**: 15 minutes
- **Access Token Lifespan For Implicit Flow**: 15 minutes
- **Client login timeout**: 1 minute
- **Offline Session Idle**: 30 days
- **Offline Session Max Limited**: 60 days
- **Access Token Lifespan**: 15 minutes
- **Access Token Lifespan For Implicit Flow**: 15 minutes
- **Client login timeout**: 1 minute
- **Offline Session Idle**: 30 days
- **Offline Session Max Limited**: 60 days

## Client Configuration

Keycloak clients represent applications that can request authentication. The onesso service requires two clients:

### Admin Client (onesso-admin)

This client is used by the onesso service to interact with Keycloak's admin API.

1. Go to "Clients" and click "Create"
2. Set the following values:
   - **Client ID**: onesso-admin
   - **Client Protocol**: openid-connect
   - **Root URL**: http://localhost:3002 (adjust for your environment)
3. Click "Save"
4. On the Settings tab, update:
   - **Access Type**: confidential
   - **Service Accounts Enabled**: ON
   - **Authorization Enabled**: OFF
   - **Valid Redirect URIs**: http://localhost:3002/* (adjust for your environment)
   - **Web Origins**: http://localhost:3002 (adjust for your environment)
5. Click "Save"
6. Go to the "Credentials" tab and note the Secret value

### Public Client (onesso-public)

This client is used by frontend applications to authenticate users.

1. Go to "Clients" and click "Create"
2. Set the following values:
   - **Client ID**: onesso-public
   - **Client Protocol**: openid-connect
   - **Root URL**: http://localhost:3000 (adjust for your frontend URL)
3. Click "Save"
4. On the Settings tab, update:
   - **Access Type**: public
   - **Standard Flow Enabled**: ON
   - **Implicit Flow Enabled**: OFF
   - **Direct Access Grants Enabled**: ON
   - **Service Accounts Enabled**: OFF
   - **Authorization Enabled**: OFF
   - **Valid Redirect URIs**: http://localhost:3000/* (adjust for your frontend URL)
   - **Web Origins**: http://localhost:3000 (adjust for your frontend URL)
5. Click "Save"

### Client Scopes

Both clients need specific scopes to function properly:

1. Go to "Client Scopes" and click "Create"
2. Create a scope named "tenant" with:
   - **Protocol**: openid-connect
   - **Display On Consent Screen**: ON
   - **Include In Token Scope**: ON
3. Add a mapper to this scope:
   - **Name**: tenant_id
   - **Mapper Type**: User Attribute
   - **User Attribute**: tenant_id
   - **Token Claim Name**: tenant_id
   - **Claim JSON Type**: String
   - **Add to ID token**: ON
   - **Add to access token**: ON
   - **Add to userinfo**: ON
4. Assign this scope to both clients as a Default Client Scope

## User Federation

If you need to connect to an existing user database:

### LDAP Configuration

1. Go to "User Federation" and select "ldap"
2. Configure the connection:
   - **Vendor**: Active Directory, Red Hat Directory Server, etc.
   - **Connection URL**: ldap://your-ldap-server:389
   - **Users DN**: ou=users,dc=example,dc=com
   - **Authentication Type**: simple
   - **Bind DN**: cn=admin,dc=example,dc=com
   - **Bind Credential**: your-password
3. Click "Save" and "Test connection"
4. Configure synchronization settings as needed

### Database Configuration

For database federation:

1. Go to "User Federation" and select "kerberos" or use a custom provider
2. Follow the specific configuration steps for your database type

## Identity Providers

To enable social login:

1. Go to "Identity Providers"
2. Select the provider (Google, GitHub, Facebook, etc.)
3. Configure with client ID and secret from the provider
4. Set the Redirect URI to: http://localhost:8080/auth/realms/onesso/broker/{provider}/endpoint
5. Configure additional settings as needed

Example for Google:

- **Client ID**: your-google-client-id
- **Client Secret**: your-google-client-secret
- **Default Scopes**: openid email profile
- **Hosted Domain**: (optional, for G Suite domains)

## Role Configuration

Roles define permissions in the system:

1. Go to "Roles" and click "Add Role"
2. Create the following roles:
   - **user**: Basic user role
   - **admin**: Administrative role
   - **tenant_admin**: Tenant administrator role
3. For each role, set:
   - **Name**: role name
   - **Description**: role description
4. Add role attributes as needed

## Multi-Tenant Configuration

Multi-tenancy in onesso is implemented using Keycloak's attributes and roles:

### Tenant Attributes

1. Go to "Client Scopes" and ensure the "tenant" scope is configured as described earlier
2. For each user that belongs to a tenant:
   - Go to the user's profile
   - Add an attribute named "tenant_id" with the tenant identifier

### Tenant-Specific Roles

1. Create roles for each tenant with naming convention: `tenant_{tenant_id}_{role}`
   - Example: tenant_acme_admin, tenant_acme_user
2. Assign these roles to users based on their tenant access

### Tenant Groups

1. Go to "Groups" and click "New"
2. Create a group for each tenant
3. Add subgroups for roles within the tenant
4. Assign users to the appropriate groups

## Token Settings

Configure token settings to ensure proper JWT claims:

1. Go to "Realm Settings" > "Tokens"
2. Set the following:
   - **Default Signature Algorithm**: RS256
   - **Revoke Refresh Token**: ON (when access token is refreshed)
   - **Access Token Lifespan**: 15 minutes (adjust as needed)
   - **Client Login Timeout**: 1 minute
   - **Offline Session Idle**: 30 days
   - **Offline Session Max Limited**: 60 days

### Protocol Mappers

1. Go to "Client Scopes" > "roles" > "Mappers"
2. Ensure the following mappers exist:
   - **realm roles**: Maps realm roles to the token
   - **client roles**: Maps client roles to the token
   - **audience resolve**: Adds audience to the token

## Email Configuration

Configure email settings for user verification and password reset:

1. Go to "Realm Settings" > "Email"
2. Configure SMTP settings:
   - **Host**: your-smtp-server
   - **Port**: 587 (or appropriate port)
   - **From**: no-reply@yourdomain.com
   - **Enable StartTLS**: ON (if using TLS)
   - **Enable Authentication**: ON (if required)
   - **Username**: your-smtp-username
   - **Password**: your-smtp-password

## Themes

Customize the look and feel:

1. Go to "Realm Settings" > "Themes"
2. Set themes for:
   - **Login Theme**: keycloak (or custom theme)
   - **Account Theme**: keycloak (or custom theme)
   - **Admin Console Theme**: keycloak (or custom theme)
   - **Email Theme**: keycloak (or custom theme)

## Troubleshooting

### Common Issues

1. **Invalid Redirect URI**:
   - Ensure the redirect URIs in Keycloak match exactly with the URLs used by your applications
   - Check for trailing slashes and protocol (http vs https)

2. **Token Validation Failures**:
   - Verify the JWT secret or public key configuration
   - Check token expiration settings
   - Ensure clocks are synchronized between servers

3. **CORS Errors**:
   - Add all frontend origins to the Web Origins in client settings
   - Check that the Keycloak server has proper CORS headers

4. **Connection Refused**:
   - Verify Keycloak is running and accessible
   - Check network connectivity and firewall settings

### Logging

To enable debug logging in Keycloak:

1. Edit `standalone.xml` or use environment variables
2. Set the log level to DEBUG for org.keycloak
3. Restart Keycloak

### Health Check

Use the health endpoint to verify Keycloak is running properly:

```
GET http://localhost:8080/auth/health
```

## Additional Resources

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Keycloak Admin REST API](https://www.keycloak.org/docs-api/22.0/rest-api/index.html)
- [Keycloak JavaScript Adapter](https://www.keycloak.org/docs/latest/securing_apps/#_javascript_adapter)
