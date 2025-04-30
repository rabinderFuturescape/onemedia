/**
 * User Migration Script
 * 
 * This script migrates users from the existing auth system to Keycloak.
 * It reads users from the source database and creates them in Keycloak.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const KcAdminClient = require('keycloak-admin').default;
const fs = require('fs');
const path = require('path');

// Initialize Prisma client for the source database
const prisma = new PrismaClient({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

// Initialize Keycloak admin client
const keycloak = new KcAdminClient({
  baseUrl: process.env.KEYCLOAK_URL,
  realmName: 'master', // Initially connect to master realm
});

// Log file setup
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, `migration-${new Date().toISOString().replace(/:/g, '-')}.log`);
const errorLogFile = path.join(logDir, `migration-errors-${new Date().toISOString().replace(/:/g, '-')}.log`);

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

async function migrateUsers() {
  try {
    log('Starting user migration...');

    // Authenticate with Keycloak
    log('Authenticating with Keycloak...');
    await keycloak.auth({
      username: process.env.KEYCLOAK_ADMIN,
      password: process.env.KEYCLOAK_ADMIN_PASSWORD,
      grantType: 'password',
      clientId: 'admin-cli',
    });

    // Switch to onesso realm
    keycloak.setConfig({
      realmName: 'onesso',
    });

    // Get all users from the source database
    log('Fetching users from source database...');
    const users = await prisma.user.findMany();
    log(`Found ${users.length} users to migrate.`);

    // Get all organizations from the source database
    log('Fetching organizations from source database...');
    const organizations = await prisma.organization.findMany();
    log(`Found ${organizations.length} organizations to migrate as tenants.`);

    // Create tenants in Keycloak
    log('Creating tenants in Keycloak...');
    for (const org of organizations) {
      try {
        // Check if tenant role already exists
        const existingRoles = await keycloak.roles.find();
        const tenantRoleName = `tenant:${org.id}`;
        const tenantRoleExists = existingRoles.some(role => role.name === tenantRoleName);

        if (!tenantRoleExists) {
          // Create tenant role
          await keycloak.roles.create({
            name: tenantRoleName,
            description: `Tenant: ${org.name}`,
            attributes: {
              'tenant_display_name': [org.name],
              'tenant_description': [org.description || ''],
            },
          });
          log(`Created tenant role for organization: ${org.name} (${org.id})`);
        } else {
          log(`Tenant role already exists for organization: ${org.name} (${org.id})`);
        }
      } catch (error) {
        logError(`Failed to create tenant for organization: ${org.name} (${org.id})`, error);
      }
    }

    // Migrate users to Keycloak
    log('Migrating users to Keycloak...');
    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Check if user already exists in Keycloak
        const existingUsers = await keycloak.users.find({
          email: user.email,
          exact: true,
        });

        if (existingUsers.length > 0) {
          log(`User already exists in Keycloak: ${user.email} (${user.id})`);
          continue;
        }

        // Create user in Keycloak
        const newUser = {
          username: user.email,
          email: user.email,
          firstName: user.name || '',
          lastName: user.lastName || '',
          enabled: true,
          emailVerified: user.activated,
          attributes: {
            provider: [user.providerName],
            providerId: user.providerId ? [user.providerId] : undefined,
            original_id: [user.id],
          },
        };

        // Create user
        const createdUser = await keycloak.users.create(newUser);
        log(`Created user in Keycloak: ${user.email} (${createdUser.id})`);

        // Assign default role
        await keycloak.users.addRealmRoleMappings({
          id: createdUser.id,
          roles: [
            {
              name: 'user',
            },
          ],
        });

        // If user is super admin, assign admin role
        if (user.isSuperAdmin) {
          await keycloak.users.addRealmRoleMappings({
            id: createdUser.id,
            roles: [
              {
                name: 'admin',
              },
            ],
          });
          log(`Assigned admin role to user: ${user.email} (${createdUser.id})`);
        }

        // Get user's organizations
        const userOrgs = await prisma.userOrganization.findMany({
          where: {
            userId: user.id,
            disabled: false,
          },
          include: {
            organization: true,
          },
        });

        // Assign tenant roles
        for (const userOrg of userOrgs) {
          const tenantRoleName = `tenant:${userOrg.organizationId}`;
          
          await keycloak.users.addRealmRoleMappings({
            id: createdUser.id,
            roles: [
              {
                name: tenantRoleName,
              },
            ],
          });

          // If user is org admin, assign tenant-admin role
          if (userOrg.role === 'ADMIN') {
            await keycloak.users.addRealmRoleMappings({
              id: createdUser.id,
              roles: [
                {
                  name: 'tenant-admin',
                },
              ],
            });
            log(`Assigned tenant-admin role to user: ${user.email} (${createdUser.id})`);
          }

          log(`Assigned tenant role ${tenantRoleName} to user: ${user.email} (${createdUser.id})`);
        }

        // Set primary tenant
        if (userOrgs.length > 0) {
          await keycloak.users.update(
            { id: createdUser.id },
            {
              attributes: {
                ...newUser.attributes,
                tenant_id: [userOrgs[0].organizationId],
              },
            }
          );
          log(`Set primary tenant for user: ${user.email} (${createdUser.id}) to ${userOrgs[0].organizationId}`);
        }

        successCount++;
      } catch (error) {
        logError(`Failed to migrate user: ${user.email} (${user.id})`, error);
        errorCount++;
      }
    }

    log(`Migration completed. Successfully migrated ${successCount} users. Failed to migrate ${errorCount} users.`);
  } catch (error) {
    logError('Migration failed with an error', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateUsers();
