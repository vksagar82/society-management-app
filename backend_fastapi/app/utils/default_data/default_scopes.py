"""Default scopes seeding utilities via API calls."""

import asyncio
import os
from datetime import datetime, timedelta
from pathlib import Path
from uuid import UUID

import httpx
import jwt
from jwt.exceptions import InvalidTokenError

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


async def seed_default_scopes() -> dict:
    """
    Seed default scopes using the API endpoints, not direct DB access.

    Returns:
        dict: Detailed result with operations performed and final scopes
    """

    base_url = _get_base_url()
    token = _get_token()
    headers = {"Authorization": f"Bearer {token}"}
    operations = []

    async with httpx.AsyncClient(base_url=base_url, timeout=20) as client:
        # Fetch existing scopes
        print("\n[SCOPES] Fetching existing scopes...")
        resp = await client.get("/api/v1/roles/scopes", headers=headers)
        await asyncio.sleep(2)
        if resp.status_code != 200:
            raise RuntimeError(f"Failed to list scopes: {resp.status_code} {resp.text}")
        existing = {item["name"]: item for item in resp.json()}
        print(f"[SCOPES] Found {len(existing)} existing scopes")
        operations.append(
            {
                "action": "GET",
                "endpoint": "/api/v1/roles/scopes",
                "status": resp.status_code,
                "result": f"Found {len(existing)} scopes",
            }
        )

        # Create or update
        for name, description in SCOPES_DEF.items():
            current = existing.get(name)
            if current is None:
                print(f"[SCOPES] Creating scope '{name}'...")
                resp = await client.post(
                    "/api/v1/roles/scopes",
                    json={"name": name, "description": description},
                    headers=headers,
                )
                await asyncio.sleep(2)
                if resp.status_code not in (200, 201):
                    raise RuntimeError(
                        f"Failed to create scope {name}: {resp.status_code} {resp.text}"
                    )
                print(f"[SCOPES] ✓ Created scope '{name}' - Status: {resp.status_code}")
                operations.append(
                    {
                        "action": "POST",
                        "endpoint": "/api/v1/roles/scopes",
                        "scope": name,
                        "status": resp.status_code,
                        "result": "Created",
                    }
                )
            elif current.get("description") != description:
                print(f"[SCOPES] Updating scope '{name}'...")
                resp = await client.patch(
                    f"/api/v1/roles/scopes/{name}",
                    json={"description": description},
                    headers=headers,
                )
                await asyncio.sleep(2)
                if resp.status_code not in (200, 204):
                    raise RuntimeError(
                        f"Failed to update scope {name}: {resp.status_code} {resp.text}"
                    )
                print(f"[SCOPES] ✓ Updated scope '{name}' - Status: {resp.status_code}")
                operations.append(
                    {
                        "action": "PATCH",
                        "endpoint": f"/api/v1/roles/scopes/{name}",
                        "scope": name,
                        "status": resp.status_code,
                        "result": "Updated",
                    }
                )
            else:
                print(
                    f"[SCOPES] ✓ Scope '{name}' already exists with correct description - Skipped"
                )
                operations.append(
                    {"action": "SKIP", "scope": name, "result": "Already exists"}
                )

        # Return fresh view
        print("\n[SCOPES] Fetching final scopes list...")
        resp = await client.get("/api/v1/roles/scopes", headers=headers)
        await asyncio.sleep(2)
        if resp.status_code != 200:
            raise RuntimeError(
                f"Failed to list scopes after seeding: {resp.status_code} {resp.text}"
            )
        data = resp.json()
        final_scopes = {
            item["name"]: item for item in data if item.get("name") in SCOPES_DEF
        }
        operations.append(
            {
                "action": "GET",
                "endpoint": "/api/v1/roles/scopes",
                "status": resp.status_code,
                "result": f"Final count: {len(final_scopes)}",
            }
        )

        print(f"[SCOPES] ✓ Seeding complete - {len(final_scopes)} scopes verified\n")

        return {
            "scopes": final_scopes,
            "operations": operations,
            "summary": {
                "total_scopes": len(SCOPES_DEF),
                "created": sum(1 for op in operations if op.get("action") == "POST"),
                "updated": sum(1 for op in operations if op.get("action") == "PATCH"),
                "skipped": sum(1 for op in operations if op.get("action") == "SKIP"),
            },
        }
