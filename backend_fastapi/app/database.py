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
DATABASE_URL = settings.database_url
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

DATABASE_URL = DATABASE_URL.replace("?sslmode=require&pgbouncer=true", "").replace("?sslmode=require", "")

# Ensure asyncpg disables statement caching via URL params too.
if "?" in DATABASE_URL:
    DATABASE_URL = f"{DATABASE_URL}&statement_cache_size=0"
else:
    DATABASE_URL = f"{DATABASE_URL}?statement_cache_size=0"


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


# Use direct PostgreSQL port (5432) to bypass pgbouncer prepared statement issues
DIRECT_DATABASE_URL = build_supabase_direct_url(DATABASE_URL)

# Create async database engine using direct connection to avoid pgbouncer issues
engine = create_async_engine(
    DIRECT_DATABASE_URL,  # Direct port 5432 to bypass pgbouncer
    echo=False,
    future=True,
    poolclass=NullPool,
    pool_pre_ping=True,  # recommended for Supabase
    connect_args={
        "ssl": "require",
        # Disable asyncpg prepared statements
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        "server_settings": {
            "jit": "off",
            "application_name": "society_mgmt_api",
        },
    },
)


# Force simple execution (no server-side prepares) via execution_options
engine = engine.execution_options(prepared=False)


def create_direct_engine_for_schema():
    """Create an async engine aimed at the direct Postgres port for DDL."""

    # Already using direct URL for main engine, so reuse it
    direct_url = DIRECT_DATABASE_URL
    direct_engine = create_async_engine(
        direct_url,
        echo=False,
        future=True,
        poolclass=NullPool,
        pool_pre_ping=False,
        connect_args={
            "ssl": "require",
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
            "server_settings": {
                "jit": "off",
                "application_name": "society_mgmt_direct",
            },
        },
    )
    return direct_engine.execution_options(prepared=False)


# Async session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
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
