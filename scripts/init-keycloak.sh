#!/bin/bash

# Initialize Keycloak with the onesso realm and admin user

# Get an admin token
echo "Getting admin token..."
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" == "null" ]; then
  echo "Failed to get admin token. Make sure Keycloak is running and accessible."
  exit 1
fi

echo "Admin token obtained successfully."

# Check if onesso realm already exists
REALM_EXISTS=$(curl -s -X GET http://localhost:8080/admin/realms/onesso \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -w "%{http_code}" -o /dev/null)

if [ "$REALM_EXISTS" == "200" ]; then
  echo "Realm 'onesso' already exists."
else
  echo "Creating 'onesso' realm..."
  
  # Create onesso realm
  curl -s -X POST http://localhost:8080/admin/realms \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "realm": "onesso",
      "enabled": true,
      "displayName": "OneSSO",
      "displayNameHtml": "<div class=\"kc-logo-text\"><span>OneSSO</span></div>",
      "sslRequired": "external",
      "registrationAllowed": true,
      "loginWithEmailAllowed": true,
      "duplicateEmailsAllowed": false,
      "resetPasswordAllowed": true,
      "editUsernameAllowed": false,
      "bruteForceProtected": true,
      "permanentLockout": false,
      "maxFailureWaitSeconds": 900,
      "minimumQuickLoginWaitSeconds": 60,
      "waitIncrementSeconds": 60,
      "quickLoginCheckMilliSeconds": 1000,
      "maxDeltaTimeSeconds": 43200,
      "failureFactor": 30
    }'
  
  echo "Realm 'onesso' created."
fi

# Create client
echo "Creating client 'postiz-client'..."
CLIENT_ID=$(curl -s -X POST http://localhost:8080/admin/realms/onesso/clients \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "postiz-client",
    "name": "Postiz Client",
    "enabled": true,
    "publicClient": false,
    "secret": "postiz-secret",
    "redirectUris": ["http://localhost:4200/*"],
    "webOrigins": ["http://localhost:4200"],
    "protocol": "openid-connect",
    "attributes": {
      "access.token.lifespan": "1800",
      "refresh.token.lifespan": "86400"
    },
    "fullScopeAllowed": true,
    "directAccessGrantsEnabled": true
  }' | jq -r '.id')

echo "Client created with ID: $CLIENT_ID"

# Create roles
echo "Creating roles..."
# Admin role
curl -s -X POST http://localhost:8080/admin/realms/onesso/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "admin",
    "description": "Administrator role"
  }'

# User role
curl -s -X POST http://localhost:8080/admin/realms/onesso/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "user",
    "description": "User role"
  }'

# Tenant-admin role
curl -s -X POST http://localhost:8080/admin/realms/onesso/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "tenant-admin",
    "description": "Tenant administrator role"
  }'

echo "Roles created."

# Create admin user
echo "Creating admin user..."
USER_ID=$(curl -s -X POST http://localhost:8080/admin/realms/onesso/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@example.com",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "enabled": true,
    "emailVerified": true,
    "credentials": [
      {
        "type": "password",
        "value": "admin",
        "temporary": false
      }
    ],
    "attributes": {
      "provider": ["LOCAL"],
      "tenant_id": ["default-org"]
    }
  }' | jq -r '.id')

if [ -z "$USER_ID" ] || [ "$USER_ID" == "null" ]; then
  # User might already exist, try to get the ID
  USER_ID=$(curl -s -X GET "http://localhost:8080/admin/realms/onesso/users?username=admin@example.com" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id')
  
  if [ -z "$USER_ID" ] || [ "$USER_ID" == "null" ]; then
    echo "Failed to create or find admin user."
    exit 1
  else
    echo "Admin user already exists with ID: $USER_ID"
    
    # Reset password
    curl -s -X PUT "http://localhost:8080/admin/realms/onesso/users/$USER_ID/reset-password" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "type": "password",
        "value": "admin",
        "temporary": false
      }'
    
    echo "Reset password for admin user."
  fi
else
  echo "Admin user created with ID: $USER_ID"
fi

# Get role IDs
ADMIN_ROLE_ID=$(curl -s -X GET "http://localhost:8080/admin/realms/onesso/roles/admin" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.id')

USER_ROLE_ID=$(curl -s -X GET "http://localhost:8080/admin/realms/onesso/roles/user" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.id')

TENANT_ADMIN_ROLE_ID=$(curl -s -X GET "http://localhost:8080/admin/realms/onesso/roles/tenant-admin" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.id')

# Assign roles to admin user
echo "Assigning roles to admin user..."
# Assign admin role
curl -s -X POST "http://localhost:8080/admin/realms/onesso/users/$USER_ID/role-mappings/realm" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "[
    {
      \"id\": \"$ADMIN_ROLE_ID\",
      \"name\": \"admin\"
    },
    {
      \"id\": \"$USER_ROLE_ID\",
      \"name\": \"user\"
    },
    {
      \"id\": \"$TENANT_ADMIN_ROLE_ID\",
      \"name\": \"tenant-admin\"
    }
  ]"

echo "Roles assigned to admin user."

# Create tenant role
echo "Creating tenant role..."
TENANT_ID="default-org"
TENANT_ROLE_NAME="tenant:$TENANT_ID"

# Check if tenant role already exists
TENANT_ROLE_EXISTS=$(curl -s -X GET "http://localhost:8080/admin/realms/onesso/roles/$TENANT_ROLE_NAME" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -w "%{http_code}" -o /dev/null)

if [ "$TENANT_ROLE_EXISTS" == "200" ]; then
  echo "Tenant role '$TENANT_ROLE_NAME' already exists."
  
  # Get tenant role ID
  TENANT_ROLE_ID=$(curl -s -X GET "http://localhost:8080/admin/realms/onesso/roles/$TENANT_ROLE_NAME" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.id')
else
  # Create tenant role
  curl -s -X POST http://localhost:8080/admin/realms/onesso/roles \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$TENANT_ROLE_NAME\",
      \"description\": \"Tenant: Default Organization\"
    }"
  
  # Get tenant role ID
  TENANT_ROLE_ID=$(curl -s -X GET "http://localhost:8080/admin/realms/onesso/roles/$TENANT_ROLE_NAME" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.id')
  
  # Add attributes to tenant role
  curl -s -X POST "http://localhost:8080/admin/realms/onesso/roles/$TENANT_ROLE_NAME/attributes" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "tenant_display_name": ["Default Organization"],
      "tenant_description": ["Default organization for testing"]
    }'
  
  echo "Tenant role '$TENANT_ROLE_NAME' created with ID: $TENANT_ROLE_ID"
fi

# Assign tenant role to admin user
echo "Assigning tenant role to admin user..."
curl -s -X POST "http://localhost:8080/admin/realms/onesso/users/$USER_ID/role-mappings/realm" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "[
    {
      \"id\": \"$TENANT_ROLE_ID\",
      \"name\": \"$TENANT_ROLE_NAME\"
    }
  ]"

echo "Tenant role assigned to admin user."

echo "Keycloak initialization completed successfully!"
