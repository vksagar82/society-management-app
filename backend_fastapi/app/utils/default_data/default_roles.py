"""Default roles seeding utilities."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

from app.database import create_direct_engine_for_schema
from app.models import Role


async def seed_default_roles() -> dict:
    """
    Seed default roles into the database.

    Returns:
        dict: Dictionary of seeded roles {name: description}
    """
    roles_def = {
        "developer": "Developer -- Have access to everything",
        "admin": "Admin -- Has access to everything but cannot delete the logs",
        "manager": "Manager -- Has access to everything except cannot delete logs, assets, amc",
        "member": "Member -- Has only view access of everything",
    }

    direct_engine = create_direct_engine_for_schema()
    async_session = sessionmaker(
        bind=direct_engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with async_session() as db:
            # Fetch existing roles
            result = await db.execute(select(Role).where(Role.name.in_(roles_def.keys())))
            existing = {role.name: role for role in result.scalars().all()}

            # Upsert roles and align descriptions
            for name, description in roles_def.items():
                role = existing.get(name)
                if role:
                    if role.description != description:
                        role.description = description
                else:
                    db.add(Role(name=name, description=description))

            await db.commit()

            # Validate roles are present with correct descriptions
            result = await db.execute(select(Role))
            roles = {role.name: role.description for role in result.scalars().all()}

            for name, description in roles_def.items():
                assert name in roles, f"Missing role: {name}"
                assert roles[name] == description, f"Role description mismatch for {name}"

            return roles
    finally:
        await direct_engine.dispose()
