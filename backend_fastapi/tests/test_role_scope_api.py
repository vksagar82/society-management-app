import os
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from uuid import UUID

import asyncio
import httpx
import pytest
from jose import jwt
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models import User
from config import settings

# Precomputed bcrypt hash for the password "password" (cost=12) to avoid
# runtime hashing and any bcrypt length limits during test setup.
PASSWORD_HASH = "$2b$12$KIXIDZThs4GNrbfSu5nxeu28pQ5e0siJmq9hw3rrodpJ8WcN6iLMi"


def _load_local_env():
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and value and key not in os.environ:
            os.environ[key] = value


_load_local_env()

APP_BASE_URL = os.environ.get("APP_BASE_URL", "http://127.0.0.1:8000")
# developer/admin token required for mutations
DEV_TOKEN = os.environ.get("APP_DEV_TOKEN")

# Fixed UUID used in the token
DEV_USER_ID = UUID('00000000-0000-0000-0000-000000000001')


def _make_dev_token() -> str:
    payload = {
        "sub": str(DEV_USER_ID),
        "scope": "developer admin",
        "exp": datetime.utcnow() + timedelta(days=30),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


@pytest.fixture(scope="session", autouse=True)
async def setup_dev_user():
    """Create the dev user once per test session."""
    async with AsyncSessionLocal() as session:
        # Always recreate the dev user to ensure clean state
        await session.execute(delete(User).where(User.id == DEV_USER_ID))
        user = User(
            id=DEV_USER_ID,
            email="dev-admin@test.local",
            phone="9999999999",
            full_name="Dev Admin Test",
            password_hash=PASSWORD_HASH,
            global_role="developer",
            is_active=True
        )
        session.add(user)
        await session.commit()


@pytest.mark.asyncio
async def test_role_scope_api_crud():
    # Always generate a fresh token to ensure the subject is the fixed DEV_USER_ID
    # and matches the current secret key. Env token is ignored to avoid stale/invalid values.
    token = _make_dev_token()
    headers = {"Authorization": f"Bearer {token}"}
    role_name = f"role-{uuid.uuid4().hex[:8]}"
    scope_name = f"scope-{uuid.uuid4().hex[:8]}"

    async with httpx.AsyncClient(base_url=APP_BASE_URL, timeout=15) as client:
        # POST role
        resp = await client.post("/api/v1/roles", json={"name": role_name, "description": "temp role"}, headers=headers)
        assert resp.status_code == 201, resp.text
        await asyncio.sleep(2)

        # GET roles (list)
        resp = await client.get("/api/v1/roles", headers=headers)
        assert resp.status_code == 200
        roles = resp.json()
        assert any(r["name"] == role_name for r in roles)
        await asyncio.sleep(2)

        # PATCH role
        resp = await client.patch(f"/api/v1/roles/{role_name}", json={"description": "updated desc"}, headers=headers)
        assert resp.status_code == 200, resp.text
        assert resp.json()["description"] == "updated desc"
        await asyncio.sleep(2)

        # POST scope
        resp = await client.post("/api/v1/roles/scopes", json={"name": scope_name, "description": "temp scope"}, headers=headers)
        assert resp.status_code == 201, resp.text
        await asyncio.sleep(2)

        # GET scopes (list)
        resp = await client.get("/api/v1/roles/scopes", headers=headers)
        assert resp.status_code == 200
        scopes = resp.json()
        assert any(s["name"] == scope_name for s in scopes)
        await asyncio.sleep(2)

        # PUT role scopes (assign)
        resp = await client.put(
            f"/api/v1/roles/{role_name}/scopes",
            json={"scopes": [scope_name]},
            headers=headers,
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert any(s["name"] == scope_name for s in data.get("scopes", []))
        await asyncio.sleep(2)

        # GET role scopes
        resp = await client.get(f"/api/v1/roles/{role_name}/scopes", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert any(s["name"] == scope_name for s in data.get("scopes", []))
        await asyncio.sleep(2)

        # PATCH scope
        resp = await client.patch(
            f"/api/v1/roles/scopes/{scope_name}",
            json={"description": "updated scope"},
            headers=headers,
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["description"] == "updated scope"
        await asyncio.sleep(2)

        # DELETE scope
        resp = await client.delete(f"/api/v1/roles/scopes/{scope_name}", headers=headers)
        assert resp.status_code == 204, resp.text
        await asyncio.sleep(2)

        # DELETE role
        resp = await client.delete(f"/api/v1/roles/{role_name}", headers=headers)
        assert resp.status_code == 204, resp.text
        await asyncio.sleep(2)
