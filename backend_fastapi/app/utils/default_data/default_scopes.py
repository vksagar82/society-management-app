"""Default scopes seeding utilities."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

from app.database import create_direct_engine_for_schema
from app.models import Scope


async def seed_default_scopes() -> dict:
    """
    Seed default scopes into the database.

    Returns:
        dict: Dictionary of seeded scopes {name: Scope}
    """
    scopes_def = {
        "logs.read": "View logs",
        "logs.delete": "Delete logs",
        "assets.read": "View assets",
        "assets.write": "Create or update assets",
        "assets.delete": "Delete assets",
        "amc.read": "View AMC records",
        "amc.write": "Create or update AMC records",
        "amc.delete": "Delete AMC records",
        "issues.read": "View issues",
        "issues.write": "Create or update issues",
        "societies.read": "View societies",
        "societies.write": "Create or update societies",
        "users.read": "View users",
        "users.write": "Create or update users",
    }

    direct_engine = create_direct_engine_for_schema()
    async_session = sessionmaker(
        bind=direct_engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with async_session() as db:
            # Ensure scopes exist
            result = await db.execute(select(Scope).where(Scope.name.in_(scopes_def.keys())))
            existing_scopes = {
                scope.name: scope for scope in result.scalars().all()}
            for name, description in scopes_def.items():
                scope = existing_scopes.get(name)
                if scope:
                    if scope.description != description:
                        scope.description = description
                else:
                    db.add(Scope(name=name, description=description))
            await db.commit()

            result = await db.execute(select(Scope))
            scopes = {scope.name: scope for scope in result.scalars(
            ).all() if scope.name in scopes_def}
            return scopes
    finally:
        await direct_engine.dispose()
