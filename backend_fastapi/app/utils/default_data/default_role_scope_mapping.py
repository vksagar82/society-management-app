"""Default role-scope mapping seeding utilities via API calls."""
import asyncio
import os
from datetime import datetime, timedelta
from pathlib import Path
from uuid import UUID

import httpx
from jose import jwt, JWTError

from app.utils.default_data.default_roles import seed_default_roles, ROLES_DEF
from app.utils.default_data.default_scopes import seed_default_scopes, SCOPES_DEF


# Role-to-scope mappings
ROLE_SCOPE_MAP = {
    "developer": set(SCOPES_DEF.keys()),
    "admin": set(SCOPES_DEF.keys()) - {"logs.delete"},
    "manager": set(SCOPES_DEF.keys()) - {"logs.delete", "assets.delete", "amc.delete"},
    "member": {name for name in SCOPES_DEF if name.endswith(".read")},
}


def _get_base_url() -> str:
    return os.environ.get("APP_BASE_URL", "http://127.0.0.1:8000")


def _generate_new_dev_token() -> str:
    """Generate a new development token with 30-day expiration."""
    from typing import cast
    # Get secret key from environment, use hardcoded fallback for tests
    secret_key = os.getenv(
        "SECRET_KEY", "Hy07HivWRcrnAbOQ+Or9xsDEv89cKIWmFVLSzvVqbmzGPhXJk6x+o5vaTuyTbCxQl0g8GMyqJbgJy4c3MJyJ0w==")
    algorithm = "HS256"

    # Use fixed UUID for dev user
    dev_user_id = str(UUID('00000000-0000-0000-0000-000000000001'))

    to_encode = {
        'sub': dev_user_id,
        'scope': 'developer admin'
    }
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({'exp': int(expire.timestamp())}
                     )  # type: ignore[dict-item]

    token = jwt.encode(to_encode, secret_key,
                       algorithm=algorithm)
    print(f"[TOKEN] Generated new dev token (expires: {expire.isoformat()})")
    return cast(str, token)


def _update_env_file(new_token: str) -> None:
    """Update the APP_DEV_TOKEN in .env file."""
    # Find the .env file (should be in backend_fastapi directory)
    env_path = Path(__file__).parent.parent.parent.parent / ".env"

    if not env_path.exists():
        print(f"[TOKEN] Warning: .env file not found at {env_path}")
        return

    # Read current content
    with open(env_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Update or add APP_DEV_TOKEN
    token_found = False
    for i, line in enumerate(lines):
        if line.strip().startswith('APP_DEV_TOKEN='):
            lines[i] = f'APP_DEV_TOKEN={new_token}\n'
            token_found = True
            break

    if not token_found:
        lines.append(f'\nAPP_DEV_TOKEN={new_token}\n')

    # Write back
    with open(env_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print("[TOKEN] ✓ Updated .env file with new token")


def _is_token_valid(token: str) -> bool:
    """Check if a JWT token is valid and not expired."""
    try:
        secret_key = os.getenv(
            "SECRET_KEY", "Hy07HivWRcrnAbOQ+Or9xsDEv89cKIWmFVLSzvVqbmzGPhXJk6x+o5vaTuyTbCxQl0g8GMyqJbgJy4c3MJyJ0w==")
        algorithm = "HS256"

        # Decode and verify token
        payload = jwt.decode(token, secret_key,
                             algorithms=[algorithm])

        # Check expiration
        exp = payload.get('exp')
        if exp:
            exp_datetime = datetime.utcfromtimestamp(exp)
            if exp_datetime <= datetime.utcnow():
                print(f"[TOKEN] Token expired at {exp_datetime.isoformat()}")
                return False
            print(f"[TOKEN] Token valid until {exp_datetime.isoformat()}")

        return True
    except JWTError as e:
        print(f"[TOKEN] Invalid token: {e}")
        return False
    except Exception as e:
        print(f"[TOKEN] Error validating token: {e}")
        return False


def _get_token() -> str:
    """Get valid dev token, auto-regenerating if expired."""
    token = os.environ.get("APP_DEV_TOKEN")

    if not token:
        print("[TOKEN] APP_DEV_TOKEN not set, generating new token...")
        token = _generate_new_dev_token()
        _update_env_file(token)
        os.environ["APP_DEV_TOKEN"] = token
        return token

    # Check if token is valid
    if not _is_token_valid(token):
        print("[TOKEN] Token invalid or expired, regenerating...")
        token = _generate_new_dev_token()
        _update_env_file(token)
        os.environ["APP_DEV_TOKEN"] = token

    return token


async def seed_all_default_data() -> dict:
    """
    Seed all default data: roles, scopes, and role-scope mappings.

    Returns:
        dict: Detailed result with all operations and final state
    """

    base_url = _get_base_url()
    token = _get_token()
    headers = {"Authorization": f"Bearer {token}"}
    operations = []

    print("\n" + "=" * 80)
    print("SEEDING DEFAULT DATA: Roles, Scopes, and Mappings")
    print("=" * 80)

    # Ensure roles and scopes exist via their own API-based seeders
    print("\n[STEP 1/3] Seeding Roles...")
    roles_result = await seed_default_roles()
    operations.append({
        "step": "roles",
        "summary": roles_result.get("summary", {}),
        "operations": roles_result.get("operations", [])
    })

    print("\n[STEP 2/3] Seeding Scopes...")
    scopes_result = await seed_default_scopes()
    operations.append({
        "step": "scopes",
        "summary": scopes_result.get("summary", {}),
        "operations": scopes_result.get("operations", [])
    })

    print("\n[STEP 3/3] Mapping Scopes to Roles...")
    mapping_operations = []

    async with httpx.AsyncClient(base_url=base_url, timeout=20) as client:
        for role_name, scope_names in ROLE_SCOPE_MAP.items():
            if role_name not in roles_result.get("roles", {}):
                print(f"[MAPPING] ⚠ Skipping role '{role_name}' - not found")
                mapping_operations.append(
                    {"action": "SKIP", "role": role_name, "result": "Role not found"})
                continue

            scope_count = len(scope_names)
            print(
                f"[MAPPING] Assigning {scope_count} scopes to role '{role_name}'...")
            payload = {"scopes": sorted(scope_names)}
            resp = await client.put(
                f"/api/v1/roles/{role_name}/scopes",
                json=payload,
                headers=headers,
            )
            await asyncio.sleep(2)
            if resp.status_code not in (200, 204):
                raise RuntimeError(
                    f"Failed to set scopes for {role_name}: {resp.status_code} {resp.text}"
                )
            print(
                f"[MAPPING] ✓ Mapped {scope_count} scopes to '{role_name}' - Status: {resp.status_code}")
            mapping_operations.append({
                "action": "PUT",
                "endpoint": f"/api/v1/roles/{role_name}/scopes",
                "role": role_name,
                "scope_count": str(scope_count),
                "status": str(resp.status_code),
                "result": "Mapped"
            })

        # Fetch final mappings for verification
        print("\n[MAPPING] Fetching final role-scope mappings for verification...")
        resp = await client.get("/api/v1/roles", headers=headers)
        await asyncio.sleep(2)
        if resp.status_code != 200:
            raise RuntimeError(
                f"Failed to list roles after mappings: {resp.status_code} {resp.text}")
        final_roles = {item["name"]: item for item in resp.json(
        ) if item.get("name") in ROLES_DEF}
        mapping_operations.append({
            "action": "GET",
            "endpoint": "/api/v1/roles",
            "status": str(resp.status_code),
            "result": f"Verified {len(final_roles)} roles"
        })

        print(
            f"[MAPPING] ✓ Mapping complete - {len(final_roles)} roles verified")

    operations.append({
        "step": "mappings",
        "summary": {
            "total_roles": len(ROLE_SCOPE_MAP),
            "mapped": sum(1 for op in mapping_operations if op.get("action") == "PUT"),
            "skipped": sum(1 for op in mapping_operations if op.get("action") == "SKIP"),
        },
        "operations": mapping_operations
    })

    print("\n" + "=" * 80)
    print("SEEDING COMPLETE!")
    print("=" * 80)
    print(f"✓ Roles: {roles_result.get('summary', {}).get('total_roles', 0)} total "
          f"({roles_result.get('summary', {}).get('created', 0)} created, "
          f"{roles_result.get('summary', {}).get('updated', 0)} updated, "
          f"{roles_result.get('summary', {}).get('skipped', 0)} skipped)")
    print(f"✓ Scopes: {scopes_result.get('summary', {}).get('total_scopes', 0)} total "
          f"({scopes_result.get('summary', {}).get('created', 0)} created, "
          f"{scopes_result.get('summary', {}).get('updated', 0)} updated, "
          f"{scopes_result.get('summary', {}).get('skipped', 0)} skipped)")
    print(f"✓ Mappings: {len(ROLE_SCOPE_MAP)} roles mapped")
    print("=" * 80 + "\n")

    return {
        "roles": roles_result.get("roles", {}),
        "scopes": scopes_result.get("scopes", {}),
        "final_roles": final_roles,
        "operations": operations,
        "summary": {
            "roles": roles_result.get("summary", {}),
            "scopes": scopes_result.get("summary", {}),
            "mappings": operations[-1].get("summary", {}),
        }
    }
