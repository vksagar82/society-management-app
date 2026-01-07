# Database Directory

This directory contains all database-related SQL scripts and migrations for the Society Management System.

## Files

### Core Schema

- **schema.sql** - Complete database schema with all tables, indexes, and constraints
- **AUTH_MIGRATIONS.sql** - Authentication-related schema updates and migrations
- **INITIALIZE_ROLE_SCOPES.sql** - Default role-based access control (RBAC) scope definitions

## Database Setup

The application uses SQLAlchemy ORM with automatic table creation on startup. However, you can also manually initialize the database using these SQL files.

### Automatic Setup (Recommended)

The FastAPI application automatically creates all tables on startup based on the SQLAlchemy models defined in `backend_fastapi/app/models.py`.

### Manual Setup (Alternative)

If you prefer to use SQL scripts directly:

```bash
# Connect to your PostgreSQL database
psql -h <host> -U <username> -d <database>

# Run schema
\i schema.sql

# Run migrations (if needed)
\i AUTH_MIGRATIONS.sql

# Initialize role scopes
\i INITIALIZE_ROLE_SCOPES.sql
```

## Schema Management

The Python application models (`backend_fastapi/app/models.py`) are the source of truth for the database schema. The SQL files in this directory are maintained for:

- Reference documentation
- Manual database setup
- Migration tracking
- Database initialization scripts

## Indexes

All tables include optimized indexes for common query patterns. See `schema.sql` for the complete index definitions.

## Note

When using Supabase or pgbouncer, ensure the application is configured with:

- `prepared_statement_cache_size: 0` to disable prepared statements
- `poolclass=NullPool` to rely on pgbouncer for connection pooling
