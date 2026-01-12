"""Default roles seeding utilities via API calls."""

import asyncio
import os
from datetime import datetime, timedelta
from pathlib import Path
from uuid import UUID

import httpx
import jwt
from jwt.exceptions import InvalidTokenError

# Role definitions
ROLES_DEF = {
    "developer": "Developer -- Have access to everything",
    "admin": "Admin -- Has access to everything but cannot delete the logs",
    "manager": "Manager -- Has access to everything except cannot delete logs, assets, amc",
    "member": "Member -- Has only view access of everything",
}


def _get_base_url() -> str:
    return os.environ.get("APP_BASE_URL", "http://127.0.0.1:8000")


def _generate_new_dev_token() -> str:
    """Generate a new development token with 30-day expiration."""
    from typing import cast

    # Get secret key from environment, use hardcoded fallback for tests
    secret_key = os.getenv(
        "SECRET_KEY",
        "Hy07HivWRcrnAbOQ+Or9xsDEv89cKIWmFVLSzvVqbmzGPhXJk6x+o5vaTuyTbCxQl0g8GMyqJbgJy4c3MJyJ0w==",
    )
    algorithm = "HS256"

    dev_user_id = str(UUID("00000000-0000-0000-0000-000000000001"))
    to_encode = {"sub": dev_user_id, "scope": "developer admin"}
    expire = datetime.utcnow() + timedelta(days=30)
    # fmt: off
    to_encode.update({'exp': int(expire.timestamp())})  # type: ignore[dict-item]
    # fmt: on

    token = jwt.encode(to_encode, secret_key, algorithm=algorithm)
    print(f"[TOKEN] Generated new dev token (expires: {expire.isoformat()})")
    return cast(str, token)


def _update_env_file(new_token: str) -> None:
    """Update the APP_DEV_TOKEN in .env file."""
    env_path = Path(__file__).parent.parent.parent.parent / ".env"
    if not env_path.exists():
        print(f"[TOKEN] Warning: .env file not found at {env_path}")
        return

    with open(env_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    token_found = False
    for i, line in enumerate(lines):
        if line.strip().startswith("APP_DEV_TOKEN="):
            lines[i] = f"APP_DEV_TOKEN={new_token}\n"
            token_found = True
            break

    if not token_found:
        lines.append(f"\nAPP_DEV_TOKEN={new_token}\n")

    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print("[TOKEN] ✓ Updated .env file with new token")


def _is_token_valid(token: str) -> bool:
    """Check if a JWT token is valid and not expired."""
    try:
        secret_key = os.getenv(
            "SECRET_KEY",
            "Hy07HivWRcrnAbOQ+Or9xsDEv89cKIWmFVLSzvVqbmzGPhXJk6x+o5vaTuyTbCxQl0g8GMyqJbgJy4c3MJyJ0w==",
        )
        algorithm = "HS256"
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        exp = payload.get("exp")
        if exp:
            exp_datetime = datetime.utcfromtimestamp(exp)
            if exp_datetime <= datetime.utcnow():
                print(f"[TOKEN] Token expired at {exp_datetime.isoformat()}")
                return False
            print(f"[TOKEN] Token valid until {exp_datetime.isoformat()}")
        return True
    except InvalidTokenError as e:
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

    if not _is_token_valid(token):
        print("[TOKEN] Token invalid or expired, regenerating...")
        token = _generate_new_dev_token()
        _update_env_file(token)
        os.environ["APP_DEV_TOKEN"] = token

    return token


async def seed_default_roles() -> dict:
    """
    Seed default roles using the public API endpoints instead of direct DB access.

    Returns:
        dict: Detailed result with operations performed and final roles
    """

    base_url = _get_base_url()
    token = _get_token()
    headers = {"Authorization": f"Bearer {token}"}
    operations = []

    async with httpx.AsyncClient(base_url=base_url, timeout=20) as client:
        # Fetch existing roles
        print("\n[ROLES] Fetching existing roles...")
        resp = await client.get("/api/v1/roles", headers=headers)
        await asyncio.sleep(2)
        if resp.status_code != 200:
            raise RuntimeError(f"Failed to list roles: {resp.status_code} {resp.text}")
        existing = {item["name"]: item for item in resp.json()}
        print(f"[ROLES] Found {len(existing)} existing roles")
        operations.append(
            {
                "action": "GET",
                "endpoint": "/api/v1/roles",
                "status": resp.status_code,
                "result": f"Found {len(existing)} roles",
            }
        )

        # Create or update
        for name, description in ROLES_DEF.items():
            current = existing.get(name)
            if current is None:
                print(f"[ROLES] Creating role '{name}'...")
                resp = await client.post(
                    "/api/v1/roles",
                    json={"name": name, "description": description},
                    headers=headers,
                )
                await asyncio.sleep(2)
                if resp.status_code not in (200, 201):
                    raise RuntimeError(
                        f"Failed to create role {name}: {resp.status_code} {resp.text}"
                    )
                print(f"[ROLES] ✓ Created role '{name}' - Status: {resp.status_code}")
                operations.append(
                    {
                        "action": "POST",
                        "endpoint": "/api/v1/roles",
                        "role": name,
                        "status": resp.status_code,
                        "result": "Created",
                    }
                )
            elif current.get("description") != description:
                print(f"[ROLES] Updating role '{name}'...")
                resp = await client.patch(
                    f"/api/v1/roles/{name}",
                    json={"description": description},
                    headers=headers,
                )
                await asyncio.sleep(2)
                if resp.status_code not in (200, 204):
                    raise RuntimeError(
                        f"Failed to update role {name}: {resp.status_code} {resp.text}"
                    )
                print(f"[ROLES] ✓ Updated role '{name}' - Status: {resp.status_code}")
                operations.append(
                    {
                        "action": "PATCH",
                        "endpoint": f"/api/v1/roles/{name}",
                        "role": name,
                        "status": resp.status_code,
                        "result": "Updated",
                    }
                )
            else:
                print(
                    f"[ROLES] ✓ Role '{name}' already exists with correct description - Skipped"
                )
                operations.append(
                    {"action": "SKIP", "role": name, "result": "Already exists"}
                )

        # Return fresh view
        print("\n[ROLES] Fetching final roles list...")
        resp = await client.get("/api/v1/roles", headers=headers)
        await asyncio.sleep(2)
        if resp.status_code != 200:
            raise RuntimeError(
                f"Failed to list roles after seeding: {resp.status_code} {resp.text}"
            )
        data = resp.json()
        final_roles = {
            item["name"]: item.get("description")
            for item in data
            if item.get("name") in ROLES_DEF
        }
        operations.append(
            {
                "action": "GET",
                "endpoint": "/api/v1/roles",
                "status": resp.status_code,
                "result": f"Final count: {len(final_roles)}",
            }
        )

        print(f"[ROLES] ✓ Seeding complete - {len(final_roles)} roles verified\n")

        return {
            "roles": final_roles,
            "operations": operations,
            "summary": {
                "total_roles": len(ROLES_DEF),
                "created": sum(1 for op in operations if op.get("action") == "POST"),
                "updated": sum(1 for op in operations if op.get("action") == "PATCH"),
                "skipped": sum(1 for op in operations if op.get("action") == "SKIP"),
            },
        }
