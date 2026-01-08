import os
from datetime import datetime, timedelta
from uuid import UUID

import pytest
from httpx import AsyncClient
from jose import jwt

from app.utils.default_data.default_role_scope_mapping import seed_all_default_data
from config import settings

DEV_USER_ID = UUID('00000000-0000-0000-0000-000000000001')


def _make_dev_token() -> str:
    payload = {
        "sub": str(DEV_USER_ID),
        "scope": "developer admin",
        "exp": datetime.utcnow() + timedelta(days=30),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


@pytest.mark.asyncio
async def test_create_default_role_scope_mappings() -> None:
    """Create role->scope mappings via utility function."""

    # Generate fresh token with correct UUID subject
    os.environ["APP_DEV_TOKEN"] = _make_dev_token()

    # Make a simple API call to the running app (external) so it registers in logs/metrics
    base_url = os.environ.get("APP_BASE_URL", "http://127.0.0.1:8000")
    async with AsyncClient(base_url=base_url, timeout=10) as client:
        resp = await client.get(
            "/health",
            params={"source": "role-scope-seed"},
            headers={"X-Test-Seed": "role-scope"},
        )
        assert resp.status_code == 200

    # Seed all default data using the utility
    data = await seed_all_default_data()
    assert data is not None
    assert "roles" in data
    assert "scopes" in data
    assert len(data["roles"]) > 0
    assert len(data["scopes"]) > 0
