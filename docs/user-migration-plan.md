# User Migration Plan

This document outlines the plan for migrating existing users from the main database to the new auth microservice.

## Overview

The migration process involves transferring user authentication data from the main database to the auth microservice's database. This needs to be done carefully to ensure no data is lost and users can continue to authenticate without interruption.

## Prerequisites

- Both the main application and auth microservice must be deployed and running
- Database access to both the main database and auth microservice database
- Sufficient downtime window for the migration (if needed)
- Backup of the main database before starting migration

## Migration Steps

### 1. Preparation

1. Create a backup of the main database
   ```bash
   pg_dump -U postgres -d gitroom > gitroom_backup_$(date +%Y%m%d).sql
   ```

2. Set up environment variables for the migration scripts
   ```bash
   SOURCE_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gitroom
   TARGET_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gitroom_auth
   AUTH_SERVICE_URL=http://localhost:3001/api
   ```

3. Ensure the auth microservice schema is ready to receive user data

### 2. Test Migration

1. Create a copy of the production database in a staging environment
2. Run the migration script against the staging environment
   ```bash
   node scripts/migrate-users.js
   ```
3. Verify the migration was successful
   ```bash
   node scripts/verify-migration.js
   ```
4. Test authentication flows with migrated users

### 3. Production Migration

1. Schedule a maintenance window for the migration
2. Notify users of the upcoming maintenance
3. During the maintenance window:
   - Put the application in maintenance mode
   - Run the migration script
   ```bash
   node scripts/migrate-users.js
   ```
   - Verify the migration was successful
   ```bash
   node scripts/verify-migration.js
   ```
   - Update the application configuration to use the auth microservice
   - Test authentication flows
   - Take the application out of maintenance mode

### 4. Post-Migration Verification

1. Monitor authentication success/failure rates
2. Check for any error reports related to authentication
3. Verify that all authentication flows are working correctly
4. Keep the old authentication system as a fallback for a period of time

## Rollback Plan

If issues are encountered during or after the migration, follow these steps to roll back:

1. Revert the application configuration to use the original authentication system
2. Restore the main database from backup if necessary
3. Notify users of the issue and resolution

## Timeline

- Day 1: Prepare migration scripts and environment
- Day 2: Test migration in staging environment
- Day 3: Schedule maintenance window
- Day 4: Perform production migration
- Days 5-14: Monitor and verify authentication flows
- Day 15: Decommission old authentication system (if no issues)

## Success Criteria

The migration will be considered successful when:

1. All users are successfully migrated to the auth microservice
2. All authentication flows are working correctly
3. No increase in authentication failures is observed
4. No user reports of authentication issues

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Data loss during migration | High | Low | Create backups before migration |
| Authentication failures after migration | High | Medium | Test thoroughly in staging, keep old system as fallback |
| Performance issues with new auth service | Medium | Low | Load test before migration, monitor performance |
| Incompatible password hashing | High | Low | Verify hashing algorithms are compatible |
