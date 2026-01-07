#!/bin/bash
# Database initialization script for Society Management System

# Load environment variables if .env exists
if [ -f "../backend_fastapi/.env" ]; then
    export $(cat ../backend_fastapi/.env | grep -v '^#' | xargs)
fi

# Extract connection details from DATABASE_URL
# Format: postgres://user:password@host:port/database
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not set"
    echo "Please set DATABASE_URL environment variable or create .env file"
    exit 1
fi

echo "Initializing database schema..."
echo "Using database: $DATABASE_URL"

# Run schema files in order
echo ""
echo "1. Creating tables and indexes..."
psql "$DATABASE_URL" -f schema.sql

echo ""
echo "2. Running authentication migrations..."
psql "$DATABASE_URL" -f AUTH_MIGRATIONS.sql

echo ""
echo "3. Initializing role scopes..."
psql "$DATABASE_URL" -f INITIALIZE_ROLE_SCOPES.sql

echo ""
echo "Database initialization complete!"
echo ""
echo "You can now start the FastAPI application:"
echo "  cd ../backend_fastapi"
echo "  python main.py"
