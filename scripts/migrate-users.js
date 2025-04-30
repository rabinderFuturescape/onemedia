/**
 * User Migration Script
 * 
 * This script migrates existing users from the main database to the auth service.
 * It ensures that all user authentication data is properly transferred.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
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

// Auth service URL
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001/api';

// Migration log file
const logFile = path.join(__dirname, 'migration.log');
const errorLogFile = path.join(__dirname, 'migration-errors.log');

// Helper function to log messages
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(logFile, logMessage);
}

// Helper function to log errors
function logError(message, error) {
  const timestamp = new Date().toISOString();
  const errorMessage = `[${timestamp}] ${message}: ${error.message}\n${error.stack}\n`;
  console.error(message, error);
  fs.appendFileSync(errorLogFile, errorMessage);
}

// Main migration function
async function migrateUsers() {
  log('Starting user migration...');
  
  try {
    // Get all users from source database
    const users = await sourcePrisma.user.findMany();
    log(`Found ${users.length} users to migrate`);
    
    // Initialize counters
    let successCount = 0;
    let errorCount = 0;
    
    // Process each user
    for (const user of users) {
      try {
        log(`Migrating user: ${user.email} (${user.id})`);
        
        // Check if user already exists in target database
        const existingUser = await targetPrisma.user.findFirst({
          where: {
            email: user.email,
            providerName: user.providerName,
          },
        });
        
        if (existingUser) {
          log(`User ${user.email} already exists in target database, skipping...`);
          continue;
        }
        
        // Create user in target database
        const newUser = await targetPrisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            password: user.password,
            providerName: user.providerName,
            name: user.name,
            lastName: user.lastName,
            isSuperAdmin: user.isSuperAdmin,
            providerId: user.providerId,
            activated: user.activated,
            pictureId: user.pictureId,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            ip: user.ip,
            agent: user.agent,
          },
        });
        
        log(`Successfully migrated user: ${newUser.email} (${newUser.id})`);
        successCount++;
      } catch (error) {
        logError(`Error migrating user ${user.email} (${user.id})`, error);
        errorCount++;
      }
    }
    
    // Log summary
    log('Migration completed!');
    log(`Successfully migrated ${successCount} users`);
    log(`Failed to migrate ${errorCount} users`);
    
    if (errorCount > 0) {
      log(`Check ${errorLogFile} for details on failed migrations`);
    }
  } catch (error) {
    logError('Fatal error during migration', error);
  } finally {
    // Disconnect Prisma clients
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

// Run the migration
migrateUsers().catch((error) => {
  logError('Unhandled error during migration', error);
  process.exit(1);
});
