"""System endpoints for health checks and status."""

from fastapi import APIRouter
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import engine
from app.models import Role, Scope, RoleScope
from config import settings

router = APIRouter(prefix="/system", tags=["System"])


@router.get("/health")
async def health_check():
    """
    Health check endpoint.

    Returns the current status of the API service.
    """
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": settings.app_version,
    }


@router.get("/seed-status")
async def seed_status():
    """
    Check if default data has been seeded.

    Returns counts of roles, scopes, and role-scope mappings.
    """
    async with AsyncSession(engine) as session:
        roles_count = await session.scalar(select(func.count()).select_from(Role))
        scopes_count = await session.scalar(select(func.count()).select_from(Scope))
        mappings_count = await session.scalar(select(func.count()).select_from(RoleScope))

        return {
            "seeded": roles_count > 0 and scopes_count > 0,
            "roles_count": roles_count,
            "scopes_count": scopes_count,
            "mappings_count": mappings_count,
        }
