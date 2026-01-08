import os
import pytest
from httpx import AsyncClient

from app.utils.default_data.default_roles import seed_default_roles


@pytest.mark.asyncio
async def test_create_default_roles() -> None:
    """Create default roles via utility function."""

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
