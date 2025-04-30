/**
 * User Migration Verification Script
 * 
 * This script verifies that all users were correctly migrated from the main database to the auth service.
 * It compares user data between the two databases and reports any discrepancies.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

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

// Verification log file
const logFile = path.join(__dirname, 'verification.log');
const discrepancyLogFile = path.join(__dirname, 'discrepancies.log');

// Helper function to log messages
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(logFile, logMessage);
}

// Helper function to log discrepancies
function logDiscrepancy(message) {
  const timestamp = new Date().toISOString();
  const discrepancyMessage = `[${timestamp}] ${message}\n`;
  console.warn(message);
  fs.appendFileSync(discrepancyLogFile, discrepancyMessage);
}

// Helper function to compare user objects
function compareUsers(sourceUser, targetUser) {
  const discrepancies = [];
  
  // Fields to compare
  const fieldsToCompare = [
    'id',
    'email',
    'password',
    'providerName',
    'name',
    'lastName',
    'isSuperAdmin',
    'providerId',
    'activated',
    'pictureId',
  ];
  
  for (const field of fieldsToCompare) {
    if (sourceUser[field] !== targetUser[field]) {
      discrepancies.push({
        field,
        source: sourceUser[field],
        target: targetUser[field],
      });
    }
  }
  
  return discrepancies;
}

// Main verification function
async function verifyMigration() {
  log('Starting migration verification...');
  
  try {
    // Get all users from source database
    const sourceUsers = await sourcePrisma.user.findMany();
    log(`Found ${sourceUsers.length} users in source database`);
    
    // Get all users from target database
    const targetUsers = await targetPrisma.user.findMany();
    log(`Found ${targetUsers.length} users in target database`);
    
    // Check for missing users
    const sourceUserIds = sourceUsers.map(user => user.id);
    const targetUserIds = targetUsers.map(user => user.id);
    
    const missingUsers = sourceUsers.filter(user => !targetUserIds.includes(user.id));
    if (missingUsers.length > 0) {
      logDiscrepancy(`Found ${missingUsers.length} users missing from target database`);
      for (const user of missingUsers) {
        logDiscrepancy(`Missing user: ${user.email} (${user.id})`);
      }
    } else {
      log('All users from source database exist in target database');
    }
    
    // Check for extra users
    const extraUsers = targetUsers.filter(user => !sourceUserIds.includes(user.id));
    if (extraUsers.length > 0) {
      log(`Found ${extraUsers.length} extra users in target database (this may be expected)`);
    }
    
    // Compare user data
    let discrepancyCount = 0;
    
    for (const sourceUser of sourceUsers) {
      const targetUser = targetUsers.find(user => user.id === sourceUser.id);
      
      if (targetUser) {
        const discrepancies = compareUsers(sourceUser, targetUser);
        
        if (discrepancies.length > 0) {
          logDiscrepancy(`Found discrepancies for user ${sourceUser.email} (${sourceUser.id}):`);
          for (const discrepancy of discrepancies) {
            logDiscrepancy(`  - ${discrepancy.field}: "${discrepancy.source}" vs "${discrepancy.target}"`);
          }
          discrepancyCount++;
        }
      }
    }
    
    // Log summary
    log('Verification completed!');
    
    if (missingUsers.length === 0 && discrepancyCount === 0) {
      log('All users were successfully migrated with no discrepancies!');
    } else {
      log(`Found ${missingUsers.length} missing users and ${discrepancyCount} users with discrepancies`);
      log(`Check ${discrepancyLogFile} for details`);
    }
  } catch (error) {
    log(`Error during verification: ${error.message}`);
    console.error(error);
  } finally {
    // Disconnect Prisma clients
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

// Run the verification
verifyMigration().catch((error) => {
  console.error('Unhandled error during verification:', error);
  process.exit(1);
});
