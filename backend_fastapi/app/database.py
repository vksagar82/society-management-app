"""
Database connection and session management.

This module handles database connectivity using SQLAlchemy async engine
for async operations with PostgreSQL.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from config import settings

# Database URL - Convert to async PostgreSQL URL
# Keep the URL simple, add pgbouncer-specific parameters in connect_args
DATABASE_URL = settings.database_url.replace(
    "postgres://", "postgresql+asyncpg://"
).replace("?sslmode=require&pgbouncer=true", "").replace("?sslmode=require", "")

# Create async database engine optimized for pgbouncer
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    poolclass=NullPool,  # Disable connection pooling (pgbouncer handles this)
    pool_pre_ping=False,  # Disable pre-ping as it can cause issues with pgbouncer
    connect_args={
        "ssl": "require",
        "statement_cache_size": 0,  # CRITICAL: Disable prepared statements for pgbouncer
        "server_settings": {
            "jit": "off"
        }
    }
)

# Async session factory
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Base class for models
Base = declarative_base()


async def get_session():
    """
    Dependency to get database session.

    Yields:
        AsyncSession: Active async database session
    """
    async with AsyncSessionLocal() as session:
        yield session
