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
from fastapi.responses import JSONResponse

from config import settings
from app.database import engine, Base, create_direct_engine_for_schema
from app.api.v1.router import api_router

# Import all models to ensure they are registered with Base.metadata
from app import models


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

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", tags=["System"])
async def health_check():
    """
    Health check endpoint.

    Returns the current status of the API service.
    """
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": settings.app_version
    }


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
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=settings.debug
    )
