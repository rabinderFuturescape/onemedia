#!/bin/bash
set -e

# This script is executed when the PostgreSQL container is started for the first time

# Create extensions
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    CREATE EXTENSION IF NOT EXISTS "btree_gin";
EOSQL

# Create test database if not in production
if [ "$NODE_ENV" != "production" ]; then
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        CREATE DATABASE "postiz-test-db";
        GRANT ALL PRIVILEGES ON DATABASE "postiz-test-db" TO "$POSTGRES_USER";
    EOSQL
fi

echo "PostgreSQL initialization completed"
