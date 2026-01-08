"""Default role-scope mapping seeding utilities."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

from app.database import create_direct_engine_for_schema
from app.models import Role, Scope, RoleScope


# Role definitions
ROLES_DEF = {
    "developer": "Developer -- Have access to everything",
    "admin": "Admin -- Has access to everything but cannot delete the logs",
    "manager": "Manager -- Has access to everything except cannot delete logs, assets, amc",
    "member": "Member -- Has only view access of everything",
}

# Scope definitions
SCOPES_DEF = {
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

# Role-to-scope mappings
ROLE_SCOPE_MAP = {
    "developer": set(SCOPES_DEF.keys()),
    "admin": set(SCOPES_DEF.keys()) - {"logs.delete"},
    "manager": set(SCOPES_DEF.keys()) - {"logs.delete", "assets.delete", "amc.delete"},
    "member": {name for name in SCOPES_DEF if name.endswith(".read")},
}


async def seed_all_default_data() -> dict:
    """
    Seed all default data: roles, scopes, and role-scope mappings.

    Returns:
        dict: Dictionary containing seeded roles and scopes
    """
    direct_engine = create_direct_engine_for_schema()
    async_session = sessionmaker(
        bind=direct_engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with async_session() as db:
            # Ensure roles exist with correct descriptions
            result = await db.execute(select(Role).where(Role.name.in_(ROLES_DEF.keys())))
            existing_roles = {
                role.name: role for role in result.scalars().all()}
            for name, description in ROLES_DEF.items():
                role = existing_roles.get(name)
                if role:
                    if role.description != description:
                        role.description = description
                else:
                    db.add(Role(name=name, description=description))
            await db.commit()

            result = await db.execute(select(Role))
            roles = {role.name: role for role in result.scalars().all()
                     if role.name in ROLES_DEF}

            # Ensure scopes exist
            result = await db.execute(select(Scope).where(Scope.name.in_(SCOPES_DEF.keys())))
            existing_scopes = {
                scope.name: scope for scope in result.scalars().all()}
            for name, description in SCOPES_DEF.items():
                scope = existing_scopes.get(name)
                if scope:
                    if scope.description != description:
                        scope.description = description
                else:
                    db.add(Scope(name=name, description=description))
            await db.commit()

            result = await db.execute(select(Scope))
            scopes = {scope.name: scope for scope in result.scalars(
            ).all() if scope.name in SCOPES_DEF}

            # Ensure role->scope mappings
            result = await db.execute(select(RoleScope))
            existing_mappings = {(rs.role_id, rs.scope_id)
                                 for rs in result.scalars().all()}

            for role_name, scope_names in ROLE_SCOPE_MAP.items():
                role = roles.get(role_name)
                if not role:
                    continue
                for scope_name in scope_names:
                    scope = scopes.get(scope_name)
                    if not scope:
                        continue
                    if (role.id, scope.id) not in existing_mappings:
                        db.add(RoleScope(role_id=role.id, scope_id=scope.id))
            await db.commit()

            # Validate mapping completeness
            result = await db.execute(select(RoleScope))
            final_mappings = {(rs.role_id, rs.scope_id)
                              for rs in result.scalars().all()}
            for role_name, scope_names in ROLE_SCOPE_MAP.items():
                role = roles.get(role_name)
                if not role:
                    continue
                for scope_name in scope_names:
                    scope = scopes.get(scope_name)
                    assert scope is not None, f"Missing scope: {scope_name}"
                    assert (
                        role.id, scope.id) in final_mappings, f"Missing mapping {role_name}->{scope_name}"

            return {"roles": roles, "scopes": scopes}
    finally:
        await direct_engine.dispose()
