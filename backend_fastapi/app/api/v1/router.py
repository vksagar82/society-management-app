"""
Main API router that includes all endpoint routers.

This module aggregates all API route modules into a single router
for inclusion in the main application.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    societies,
    issues,
    assets,
    amcs
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(societies.router)
api_router.include_router(issues.router)
api_router.include_router(assets.router)
api_router.include_router(amcs.router)
