/**
 * Create Admin User Script
 * 
 * This script creates an admin user in Keycloak with the specified credentials.
 */

require('dotenv').config();
const KcAdminClient = require('keycloak-admin').default;
const fs = require('fs');
const path = require('path');

// Initialize Keycloak admin client
const keycloak = new KcAdminClient({
  baseUrl: process.env.KEYCLOAK_URL || 'http://localhost:8080/auth',
  realmName: 'master', // Initially connect to master realm
});

// Log file setup
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = path.join(logDir, 'create-admin-user.log');
const errorLogFile = path.join(logDir, 'create-admin-user-error.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

function logError(message, error) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ERROR: ${message}`;
  const errorDetail = error ? `\n${error.stack || error}` : '';
  console.error(logMessage, errorDetail);
  fs.appendFileSync(errorLogFile, logMessage + errorDetail + '\n');
}

async function createAdminUser() {
  try {
    log('Starting admin user creation...');

    // Authenticate with Keycloak
    log('Authenticating with Keycloak...');
    await keycloak.auth({
      username: process.env.KEYCLOAK_ADMIN || 'admin',
      password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
      grantType: 'password',
      clientId: 'admin-cli',
    });

    // Switch to onesso realm
    keycloak.setConfig({
      realmName: 'onesso',
    });

    // Check if admin user already exists
    log('Checking if admin user already exists...');
    const existingUsers = await keycloak.users.find({
      email: 'admin@example.com',
      exact: true,
    });

    if (existingUsers.length > 0) {
      log('Admin user already exists, updating password...');
      
      // Update password
      await keycloak.users.resetPassword({
        id: existingUsers[0].id,
        credential: {
          temporary: false,
          type: 'password',
          value: 'admin',
        },
      });
      
      // Make sure user is enabled
      await keycloak.users.update(
        { id: existingUsers[0].id },
        { enabled: true, emailVerified: true }
      );
      
      log(`Updated admin user: admin@example.com (${existingUsers[0].id})`);
      return;
    }

    // Create admin user
    log('Creating admin user...');
    const newUser = {
      username: 'admin@example.com',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      enabled: true,
      emailVerified: true,
      credentials: [
        {
          type: 'password',
          value: 'admin',
          temporary: false,
        },
      ],
      attributes: {
        provider: ['LOCAL'],
      },
    };

    // Create user
    const createdUser = await keycloak.users.create(newUser);
    log(`Created admin user: admin@example.com (${createdUser.id})`);

    // Assign roles
    log('Assigning roles to admin user...');
    
    // Assign default user role
    await keycloak.users.addRealmRoleMappings({
      id: createdUser.id,
      roles: [
        {
          name: 'user',
        },
      ],
    });
    
    // Assign admin role
    await keycloak.users.addRealmRoleMappings({
      id: createdUser.id,
      roles: [
        {
          name: 'admin',
        },
      ],
    });
    
    log(`Assigned admin role to user: admin@example.com (${createdUser.id})`);

    // Create a default organization if it doesn't exist
    log('Creating default organization...');
    const defaultOrgId = 'default-org';
    
    // Check if tenant role already exists
    const existingRoles = await keycloak.roles.find();
    const tenantRoleName = `tenant:${defaultOrgId}`;
    const tenantRoleExists = existingRoles.some(role => role.name === tenantRoleName);

    if (!tenantRoleExists) {
      // Create tenant role
      await keycloak.roles.create({
        name: tenantRoleName,
        description: 'Tenant: Default Organization',
        attributes: {
          'tenant_display_name': ['Default Organization'],
          'tenant_description': ['Default organization for testing'],
        },
      });
      log(`Created tenant role for organization: Default Organization (${defaultOrgId})`);
    }

    // Assign tenant role to admin user
    await keycloak.users.addRealmRoleMappings({
      id: createdUser.id,
      roles: [
        {
          name: tenantRoleName,
        },
      ],
    });
    
    // Assign tenant-admin role
    await keycloak.users.addRealmRoleMappings({
      id: createdUser.id,
      roles: [
        {
          name: 'tenant-admin',
        },
      ],
    });
    
    log(`Assigned tenant roles to admin user: admin@example.com (${createdUser.id})`);

    // Set primary tenant
    await keycloak.users.update(
      { id: createdUser.id },
      {
        attributes: {
          ...newUser.attributes,
          tenant_id: [defaultOrgId],
        },
      }
    );
    log(`Set primary tenant for admin user: admin@example.com (${createdUser.id}) to ${defaultOrgId}`);

    log('Admin user creation completed successfully!');
  } catch (error) {
    logError('Admin user creation failed with an error', error);
  }
}

createAdminUser();
