import os
from datetime import datetime, timedelta
from uuid import UUID

import pytest
from httpx import AsyncClient
from jose import jwt

from app.utils.default_data.default_scopes import seed_default_scopes
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
async def test_create_default_scopes() -> None:
    """Create default scopes via utility function."""

    # Generate fresh token with correct UUID subject
    os.environ["APP_DEV_TOKEN"] = _make_dev_token()

    # Make a simple API call to the running app (external) so it registers in logs/metrics
    base_url = os.environ.get("APP_BASE_URL", "http://127.0.0.1:8000")
    async with AsyncClient(base_url=base_url, timeout=10) as client:
        resp = await client.get(
            "/health",
            params={"source": "scopes-seed"},
            headers={"X-Test-Seed": "scopes"},
        )
        assert resp.status_code == 200

    # Seed default scopes using the utility
    scopes = await seed_default_scopes()
    assert scopes is not None
    assert len(scopes) > 0
