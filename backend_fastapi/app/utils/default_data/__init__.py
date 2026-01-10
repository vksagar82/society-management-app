"""Default data seeding utilities."""
from .default_roles import seed_default_roles
from .default_scopes import seed_default_scopes
from .default_role_scope_mapping import seed_default_role_scope_mappings

__all__ = [
    "seed_default_roles",
    "seed_default_scopes",
    "seed_default_role_scope_mappings",
]


async def seed_all_default_data():
    """
    Seed all default data (roles, scopes, and role-scope mappings).
    
    This function should be called on application startup to ensure
    the database has all necessary default data for the application to work.
    """
    try:
        print("\n" + "="*60)
        print("INITIALIZING DEFAULT DATA")
        print("="*60)
        
        # Seed roles
        print("\n[INIT] Step 1/3: Seeding default roles...")
        roles_result = await seed_default_roles()
        print(f"[INIT] ✓ Roles seeded: {roles_result.get('summary', {})}")
        
        # Seed scopes
        print("\n[INIT] Step 2/3: Seeding default scopes...")
        scopes_result = await seed_default_scopes()
        print(f"[INIT] ✓ Scopes seeded: {scopes_result.get('summary', {})}")
        
        # Seed role-scope mappings
        print("\n[INIT] Step 3/3: Seeding role-scope mappings...")
        mappings_result = await seed_default_role_scope_mappings()
        print(f"[INIT] ✓ Mappings seeded: {mappings_result.get('summary', {})}")
        
        print("\n" + "="*60)
        print("DEFAULT DATA INITIALIZATION COMPLETE")
        print("="*60 + "\n")
        
        return {
            "roles": roles_result,
            "scopes": scopes_result,
            "mappings": mappings_result,
        }
    except Exception as e:
        print(f"\n[INIT] ❌ Error during default data seeding: {e}")
        raise