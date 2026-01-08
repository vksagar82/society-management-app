"""
Database connection and session management.

This module handles database connectivity using SQLAlchemy async engine
for async operations with PostgreSQL.
"""

from urllib.parse import urlparse, urlunparse

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
    pool_pre_ping=False,
    connect_args={
        "ssl": "require",
        # Disable prepared statements for pgbouncer transaction/statement mode
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        "server_settings": {
            "jit": "off"
        }
    },
)
# Force simple execution (no server-side prepares) via execution_options
engine = engine.execution_options(prepared=False)


def build_supabase_direct_url(url: str) -> str:
    """Return a Supabase connection URL pointed at the direct Postgres port (5432).

    Supabase provides a pooled port (usually 6543 via pgbouncer) that blocks DDL.
    For schema creation we need to hit the direct Postgres port.
    """

    parsed = urlparse(url)
    if "supabase.co" not in (parsed.hostname or ""):
        return url

    # If port is the pooled 6543, swap to 5432; otherwise leave as-is.
    port = parsed.port
    if port == 6543 or port is None:
        netloc = parsed.hostname
        if parsed.username and parsed.password:
            netloc = f"{parsed.username}:{parsed.password}@{netloc}"
        netloc = f"{netloc}:5432"
        parsed = parsed._replace(netloc=netloc)

    return urlunparse(parsed)


def create_direct_engine_for_schema():
    """Create an async engine aimed at the direct Postgres port for DDL."""

    direct_url = build_supabase_direct_url(DATABASE_URL)
    return create_async_engine(
        direct_url,
        echo=False,
        future=True,
        poolclass=NullPool,
        pool_pre_ping=False,
        connect_args={
            "ssl": "require",
        },
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
