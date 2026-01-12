"""Middleware configuration for FastAPI application."""

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.limiter import limiter


def setup_middleware(app: FastAPI):
    """Configure and add all middleware to the FastAPI application."""

    # SlowAPI Rate Limiting Middleware (100 requests per minute per IP)
    app.add_middleware(SlowAPIMiddleware)

    # Set limiter on app state for use in endpoints
    app.state.limiter = limiter


def setup_exception_handlers(app: FastAPI):
    """Configure exception handlers for the application."""

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_exceeded_handler(request, exc):
        """Handle rate limit exceeded errors."""
        return JSONResponse(
            status_code=429,
            content={
                "error": "Rate limit exceeded",
                "detail": "Maximum 100 requests per minute allowed",
            },
        )
