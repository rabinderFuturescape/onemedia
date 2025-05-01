#!/bin/bash

# Wait for services to be ready
echo "Waiting for services to be ready..."

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
until docker exec postiz-postgres pg_isready -U postiz-user -d postiz-db-test; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "PostgreSQL is up"

# Wait for Redis
echo "Waiting for Redis..."
until docker exec postiz-redis redis-cli ping | grep -q PONG; do
  echo "Redis is unavailable - sleeping"
  sleep 2
done
echo "Redis is up"

# Wait for Backend
echo "Waiting for Backend..."
until curl -s http://localhost:3000/api/health | grep -q "ok"; do
  echo "Backend is unavailable - sleeping"
  sleep 5
done
echo "Backend is up"

# Wait for Frontend
echo "Waiting for Frontend..."
until curl -s http://localhost:4200/api/health | grep -q "ok"; do
  echo "Frontend is unavailable - sleeping"
  sleep 5
done
echo "Frontend is up"

# Wait for Mock Onesso
echo "Waiting for Mock Onesso..."
until curl -s http://localhost:3002/health | grep -q "ok"; do
  echo "Mock Onesso is unavailable - sleeping"
  sleep 5
done
echo "Mock Onesso is up"

echo "All services are ready!"
