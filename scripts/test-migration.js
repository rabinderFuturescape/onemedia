/**
 * Migration Test Script
 * 
 * This script tests the migration process by:
 * 1. Creating test users in the source database
 * 2. Running the migration script
 * 3. Verifying the users were correctly migrated
 * 4. Testing authentication with migrated users
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Initialize Prisma clients
const sourcePrisma = new PrismaClient({
  datasource: {
    url: process.env.SOURCE_DATABASE_URL,
  },
});

const targetPrisma = new PrismaClient({
  datasource: {
    url: process.env.TARGET_DATABASE_URL,
  },
});

// Auth service URL
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001/api';

// Test log file
const logFile = path.join(__dirname, 'test-migration.log');

// Helper function to log messages
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(logFile, logMessage);
}

// Helper function to generate a random password
function generatePassword() {
  return crypto.randomBytes(8).toString('hex');
}

// Helper function to hash a password (simplified version)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Create test users in source database
async function createTestUsers(count = 5) {
  log(`Creating ${count} test users in source database...`);
  
  const users = [];
  
  for (let i = 0; i < count; i++) {
    const email = `test-user-${i}@example.com`;
    const password = generatePassword();
    const hashedPassword = hashPassword(password);
    
    try {
      // Delete user if it already exists
      await sourcePrisma.user.deleteMany({
        where: { email },
      });
      
      // Create new user
      const user = await sourcePrisma.user.create({
        data: {
          email,
          password: hashedPassword,
          providerName: 'LOCAL',
          name: `Test User ${i}`,
          lastName: 'Migration',
          activated: true,
        },
      });
      
      users.push({
        ...user,
        plainPassword: password,
      });
      
      log(`Created test user: ${email}`);
    } catch (error) {
      log(`Error creating test user ${email}: ${error.message}`);
    }
  }
  
  return users;
}

// Clean up test users from both databases
async function cleanupTestUsers(users) {
  log('Cleaning up test users...');
  
  for (const user of users) {
    try {
      await sourcePrisma.user.delete({
        where: { id: user.id },
      });
      
      log(`Deleted test user from source database: ${user.email}`);
    } catch (error) {
      log(`Error deleting test user ${user.email} from source database: ${error.message}`);
    }
    
    try {
      await targetPrisma.user.delete({
        where: { id: user.id },
      });
      
      log(`Deleted test user from target database: ${user.email}`);
    } catch (error) {
      log(`Error deleting test user ${user.email} from target database: ${error.message}`);
    }
  }
}

// Run the migration script
function runMigration() {
  log('Running migration script...');
  
  try {
    execSync('node migrate-users.js', {
      cwd: __dirname,
      stdio: 'inherit',
    });
    
    log('Migration script completed successfully');
    return true;
  } catch (error) {
    log(`Error running migration script: ${error.message}`);
    return false;
  }
}

// Verify users were migrated correctly
async function verifyMigration(users) {
  log('Verifying migration...');
  
  let successCount = 0;
  
  for (const user of users) {
    try {
      const migratedUser = await targetPrisma.user.findUnique({
        where: { id: user.id },
      });
      
      if (!migratedUser) {
        log(`User ${user.email} was not migrated`);
        continue;
      }
      
      if (migratedUser.email !== user.email) {
        log(`User ${user.email} was migrated with incorrect email: ${migratedUser.email}`);
        continue;
      }
      
      if (migratedUser.password !== user.password) {
        log(`User ${user.email} was migrated with incorrect password hash`);
        continue;
      }
      
      log(`User ${user.email} was migrated successfully`);
      successCount++;
    } catch (error) {
      log(`Error verifying migration for user ${user.email}: ${error.message}`);
    }
  }
  
  const successRate = (successCount / users.length) * 100;
  log(`Migration verification complete: ${successCount}/${users.length} users (${successRate.toFixed(2)}%)`);
  
  return successRate === 100;
}

// Test authentication with migrated users
async function testAuthentication(users) {
  log('Testing authentication with migrated users...');
  
  let successCount = 0;
  
  for (const user of users) {
    try {
      const response = await axios.post(`${authServiceUrl}/auth/login`, {
        email: user.email,
        password: user.plainPassword,
        provider: 'LOCAL',
      });
      
      if (response.status === 200 && response.data.login === true) {
        log(`Authentication successful for user ${user.email}`);
        successCount++;
      } else {
        log(`Authentication failed for user ${user.email}: Unexpected response`);
      }
    } catch (error) {
      log(`Authentication failed for user ${user.email}: ${error.message}`);
    }
  }
  
  const successRate = (successCount / users.length) * 100;
  log(`Authentication testing complete: ${successCount}/${users.length} users (${successRate.toFixed(2)}%)`);
  
  return successRate === 100;
}

// Main test function
async function testMigration() {
  log('Starting migration test...');
  
  try {
    // Create test users
    const users = await createTestUsers(5);
    
    // Run migration
    const migrationSuccess = runMigration();
    
    if (!migrationSuccess) {
      log('Migration failed, aborting test');
      await cleanupTestUsers(users);
      return false;
    }
    
    // Verify migration
    const verificationSuccess = await verifyMigration(users);
    
    if (!verificationSuccess) {
      log('Migration verification failed');
      await cleanupTestUsers(users);
      return false;
    }
    
    // Test authentication
    const authenticationSuccess = await testAuthentication(users);
    
    if (!authenticationSuccess) {
      log('Authentication testing failed');
      await cleanupTestUsers(users);
      return false;
    }
    
    // Clean up test users
    await cleanupTestUsers(users);
    
    log('Migration test completed successfully!');
    return true;
  } catch (error) {
    log(`Error during migration test: ${error.message}`);
    return false;
  } finally {
    // Disconnect Prisma clients
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

// Run the test
testMigration().then((success) => {
  if (success) {
    console.log('Migration test passed!');
    process.exit(0);
  } else {
    console.error('Migration test failed!');
    process.exit(1);
  }
}).catch((error) => {
  console.error('Unhandled error during migration test:', error);
  process.exit(1);
});
