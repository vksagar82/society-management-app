import os
from datetime import datetime, timedelta
from uuid import UUID

import pytest
from httpx import AsyncClient
from jose import jwt

from app.utils.default_data.default_roles import seed_default_roles
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
async def test_create_default_roles() -> None:
    """Create default roles via utility function."""

    # Generate fresh token with correct UUID subject
    os.environ["APP_DEV_TOKEN"] = _make_dev_token()

    # Make a simple API call to the running app (external) so it registers in logs/metrics
    base_url = os.environ.get("APP_BASE_URL", "http://127.0.0.1:8000")
    async with AsyncClient(base_url=base_url, timeout=10) as client:
        resp = await client.get(
            "/health",
            params={"source": "roles-seed"},
            headers={"X-Test-Seed": "roles"},
        )
        assert resp.status_code == 200

    # Seed default roles using the utility
    roles = await seed_default_roles()
    assert roles is not None
    assert len(roles) > 0
