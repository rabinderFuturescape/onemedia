#!/bin/bash

# This script initializes Keycloak with the onesso realm configuration

# Wait for Keycloak to be ready
echo "Waiting for Keycloak to be ready..."
until curl -s --fail http://keycloak:8080/auth/health > /dev/null; do
  sleep 5
done
echo "Keycloak is ready!"

# Get admin token
echo "Getting admin token..."
ADMIN_TOKEN=$(curl -s -X POST \
  http://keycloak:8080/auth/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${KEYCLOAK_ADMIN}" \
  -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

# Check if onesso realm already exists
echo "Checking if onesso realm exists..."
REALM_EXISTS=$(curl -s -X GET \
  http://keycloak:8080/auth/admin/realms/onesso \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -w "%{http_code}" \
  -o /dev/null)

if [ "$REALM_EXISTS" == "200" ]; then
  echo "onesso realm already exists, skipping import"
else
  echo "Importing onesso realm..."
  curl -s -X POST \
    http://keycloak:8080/auth/admin/realms \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    --data-binary @/tmp/realm-export.json
  
  echo "onesso realm imported successfully!"
fi

echo "Keycloak initialization complete!"
