"""
Main FastAPI application entry point.

This module initializes the FastAPI application with all necessary
configurations, middleware, and routers.
"""

from contextlib import asynccontextmanager

import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
import multiprocessing

from config import settings
from app.database import engine, Base, create_direct_engine_for_schema
from app.api.v1.router import api_router
from app.core.middleware import setup_middleware, setup_exception_handlers

# Import all models to ensure they are registered with Base.metadata
from app import models  # noqa: F401


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    Handles startup and shutdown events for database connections
    and other resources.
    """
    # Startup: Create missing database tables
    url_lower = settings.database_url.lower()
    is_supabase = "supabase.co" in url_lower

    ddl_engine = engine
    if is_supabase:
        ddl_engine = create_direct_engine_for_schema()
        logger.info(
            "Using direct Supabase Postgres connection for schema creation")

    try:
        async with ddl_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all, checkfirst=True)
    except Exception as exc:
        logger.exception(
            "Table creation failed during startup", exc_info=exc)
        raise
    finally:
        if ddl_engine is not engine:
            await ddl_engine.dispose()

    # Seed default data
    try:
        logger.info("Starting default data seeding...")
        from sqlalchemy.ext.asyncio import AsyncSession
        from app.utils.default_data.seed_db import seed_all_default_data

        async with AsyncSession(engine) as session:
            result = await seed_all_default_data(session)
            logger.info(
                f"Default data seeding completed successfully: {result}")
    except Exception as exc:
        logger.exception("Default data seeding failed", exc_info=exc)
        # Log but don't raise - allow app to start even if seeding fails

    # Seed developer user on startup
    try:
        logger.info("Setting up developer user...")
        from sqlalchemy.ext.asyncio import AsyncSession
        from app.utils.default_data.seed_dev_user import seed_dev_user

        async with AsyncSession(engine) as session:
            result = await seed_dev_user(session)
            logger.info(f"Developer user setup completed: {result}")
    except Exception as exc:
        logger.exception("Developer user setup failed", exc_info=exc)
        # Log but don't raise - allow app to start even if seeding fails

    # Run database migrations
    try:
        logger.info("Running database migrations...")
        from sqlalchemy.ext.asyncio import AsyncSession
        from app.migrations import run_migrations

        async with AsyncSession(engine) as session:
            await run_migrations(session)
            logger.info("Database migrations completed successfully")
    except Exception as exc:
        logger.exception("Database migrations failed", exc_info=exc)
        # Log but don't raise - allow app to start even if migrations fail

    yield

    # Shutdown
    await engine.dispose()


# Initialize FastAPI application
app = FastAPI(
    title="Society Management API",
    description="""
    A comprehensive API for managing residential societies with features including:
    * User authentication and authorization with role-based access control
    * Society and member management
    * Asset and AMC (Annual Maintenance Contract) tracking
    * Issue/Complaint management
    * Audit logging and system monitoring
    * Email notifications

    ## Authentication

    Most endpoints require JWT authentication. Include the token in the Authorization header:
    ```
    Authorization: Bearer <your-token>
    ```

    ## Roles

    * **Developer**: Full system access
    * **Admin**: Society-level administrative access
    * **Manager**: Limited administrative access
    * **Member**: Basic member access
    """,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Setup middleware
setup_middleware(app)

# Setup exception handlers
setup_exception_handlers(app)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/", tags=["System"], include_in_schema=False)
async def root_redirect():
    """
    Redirect root path to API documentation.

    Redirects / to /api/docs for easy access to the API documentation.
    """
    return RedirectResponse(url="/api/docs")


# Include API router
app.include_router(api_router, prefix="/api/v1")


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors."""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.debug else "An error occurred"
        }
    )


if __name__ == "__main__":
    # Required for Windows multiprocessing support
    multiprocessing.freeze_support()

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=settings.debug,
        reload_delay=0.5,
        use_colors=True
    )
