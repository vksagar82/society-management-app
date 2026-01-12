"""
Main API router that includes all endpoint routers.

This module aggregates all API route modules into a single router
for inclusion in the main application.
"""

from fastapi import APIRouter, Depends

from app.api.v1 import system
from app.api.v1.endpoints import (
    amcs,
    assets,
    auth,
    issues,
    roles_scopes,
    societies,
    users,
)
from app.core.deps import get_current_active_user

api_router = APIRouter()

# Include system endpoints (health, seed-status) - no auth required
api_router.include_router(system.router)

# Include all endpoint routers
# Auth router remains open for login/signup/password flows
api_router.include_router(auth.router)

# All other routers now require an authenticated user by default
auth_dependency = [Depends(get_current_active_user)]
api_router.include_router(users.router, dependencies=auth_dependency)
api_router.include_router(roles_scopes.router, dependencies=auth_dependency)
# No global auth - endpoints handle individually
api_router.include_router(societies.router)
api_router.include_router(issues.router, dependencies=auth_dependency)
api_router.include_router(assets.router, dependencies=auth_dependency)
api_router.include_router(amcs.router, dependencies=auth_dependency)
