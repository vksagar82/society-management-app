"""Direct database seeding utilities for default roles and scopes.

These functions seed default data directly via SQLAlchemy without HTTP calls,
allowing them to run during application startup.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Role, Scope, RoleScope


# Default roles definition
ROLES_DEF = {
    "developer": "Developer -- Have access to everything",
    "admin": "Admin -- Has access to everything but cannot delete the logs",
    "manager": "Manager -- Has access to everything except cannot delete logs, assets, amc",
    "member": "Member -- Has only view access of everything",
}

# Default scopes definition
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


async def seed_default_roles(session: AsyncSession) -> dict:
    """Seed default roles directly to database."""
    print("\n[SEED] Step 1/3: Seeding default roles...")

    created = 0
    skipped = 0

    for role_name, description in ROLES_DEF.items():
        # Check if role exists
        result = await session.execute(
            select(Role).where(Role.name == role_name)
        )
        existing = result.scalars().first()

        if existing:
            print(f"[SEED] ✓ Role '{role_name}' already exists - Skipped")
            skipped += 1
        else:
            role = Role(name=role_name, description=description)
            session.add(role)
            print(f"[SEED] ✓ Created role '{role_name}'")
            created += 1

    await session.commit()
    print(f"[SEED] Roles: {created} created, {skipped} skipped")

    return {
        "created": created,
        "skipped": skipped,
        "total": len(ROLES_DEF),
    }


async def seed_default_scopes(session: AsyncSession) -> dict:
    """Seed default scopes directly to database."""
    print("\n[SEED] Step 2/3: Seeding default scopes...")

    created = 0
    skipped = 0

    for scope_name, description in SCOPES_DEF.items():
        # Check if scope exists
        result = await session.execute(
            select(Scope).where(Scope.name == scope_name)
        )
        existing = result.scalars().first()

        if existing:
            print(f"[SEED] ✓ Scope '{scope_name}' already exists - Skipped")
            skipped += 1
        else:
            scope = Scope(name=scope_name, description=description)
            session.add(scope)
            print(f"[SEED] ✓ Created scope '{scope_name}'")
            created += 1

    await session.commit()
    print(f"[SEED] Scopes: {created} created, {skipped} skipped")

    return {
        "created": created,
        "skipped": skipped,
        "total": len(SCOPES_DEF),
    }


async def seed_default_role_scopes(session: AsyncSession) -> dict:
    """Seed default role-scope mappings directly to database."""
    print("\n[SEED] Step 3/3: Seeding role-scope mappings...")

    created = 0
    skipped = 0

    for role_name, scope_names in ROLE_SCOPE_MAP.items():
        # Get the role
        result = await session.execute(
            select(Role).where(Role.name == role_name)
        )
        role = result.scalars().first()

        if not role:
            print(f"[SEED] ⚠ Role '{role_name}' not found - Skipping mappings")
            continue

        for scope_name in scope_names:
            # Get the scope
            result = await session.execute(
                select(Scope).where(Scope.name == scope_name)
            )
            scope = result.scalars().first()

            if not scope:
                print(f"[SEED] ⚠ Scope '{scope_name}' not found - Skipping")
                continue

            # Check if mapping exists
            result = await session.execute(
                select(RoleScope).where(
                    (RoleScope.role_id == role.id) &
                    (RoleScope.scope_id == scope.id)
                )
            )
            existing = result.scalars().first()

            if existing:
                skipped += 1
            else:
                role_scope = RoleScope(role_id=role.id, scope_id=scope.id)
                session.add(role_scope)
                created += 1

    await session.commit()
    print(f"[SEED] Mappings: {created} created, {skipped} skipped")

    return {
        "created": created,
        "skipped": skipped,
        "total": sum(len(scopes) for scopes in ROLE_SCOPE_MAP.values()),
    }


async def seed_all_default_data(session: AsyncSession) -> dict:
    """Seed all default data (roles, scopes, and mappings)."""
    try:
        print("\n" + "="*60)
        print("SEEDING DEFAULT DATA")
        print("="*60)

        roles_result = await seed_default_roles(session)
        scopes_result = await seed_default_scopes(session)
        mappings_result = await seed_default_role_scopes(session)

        print("\n" + "="*60)
        print("DEFAULT DATA SEEDING COMPLETE")
        print("="*60 + "\n")

        return {
            "roles": roles_result,
            "scopes": scopes_result,
            "mappings": mappings_result,
        }
    except Exception as e:
        print(f"\n[SEED] ❌ Error during seeding: {e}")
        await session.rollback()
        raise
