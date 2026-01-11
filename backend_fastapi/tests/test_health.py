"""
System API - Health & Seed Status Tests

================================================================================
COVERAGE MATRIX (2/2 Endpoints)
================================================================================

1. GET /api/v1/system/health
    - Tests: Happy path (service is healthy)
    - Error cases: None (public endpoint)
    - Tested in: test_health_status_ok

2. GET /api/v1/system/seed-status
    - Tests: Happy path (returns seeded flag and counts), verifies count changes
    - Error cases: None (public endpoint)
    - Tested in: test_seed_status_reports_counts, test_seed_status_reflects_new_data

================================================================================
SCENARIO COVERAGE (3 Tests)
================================================================================

HAPPY PATH (3 tests):
✅ test_health_status_ok - Service responds healthy with metadata
✅ test_seed_status_reports_counts - Seed status payload has expected shape and seeded flag matches counts
✅ test_seed_status_reflects_new_data - Seed status updates when roles/scopes are added (with cleanup)

================================================================================
CLEANUP GUARANTEE
================================================================================

All test-created roles/scopes/mappings are removed in a finally block to avoid polluting the database. No persistent
state is left behind after the suite runs.

================================================================================
TESTING APPROACH
================================================================================

HTTP Client Testing: Tests use httpx.AsyncClient against APP_BASE_URL (defaults to http://127.0.0.1:8000/api/v1).
Calls exercise the running API exactly as deployed while keeping responses deterministic via unique test data and
explicit cleanup.
"""

import os
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Tuple

import httpx
import pytest
from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import engine
from app.models import Role, Scope, RoleScope

APP_BASE_URL = os.getenv("APP_BASE_URL", "http://127.0.0.1:8000/api/v1")
VERCEL_BYPASS_TOKEN = os.getenv("VERCEL_BYPASS_TOKEN", "")


def _get_headers() -> dict:
    """Include Vercel bypass header when configured."""
    headers = {}
    if VERCEL_BYPASS_TOKEN:
        headers["x-vercel-protection-bypass"] = VERCEL_BYPASS_TOKEN
    return headers


@asynccontextmanager
async def _get_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    """Shared async HTTP client for system endpoints."""
    async with httpx.AsyncClient(
        base_url=APP_BASE_URL, headers=_get_headers(), timeout=30.0
    ) as client:
        yield client


async def _create_role_scope(session: AsyncSession) -> Tuple[Role, Scope, RoleScope]:
    """Create unique role/scope/mapping trio for seed-status checks."""
    role = Role(name=f"health-role-{uuid.uuid4().hex[:8]}")
    scope = Scope(name=f"health-scope-{uuid.uuid4().hex[:8]}")
    session.add_all([role, scope])
    await session.flush()

    mapping = RoleScope(role_id=role.id, scope_id=scope.id)
    session.add(mapping)
    await session.commit()

    # Refresh to ensure objects are still attached
    await session.refresh(role)
    await session.refresh(scope)
    await session.refresh(mapping)

    return role, scope, mapping


async def _cleanup_role_scope(session: AsyncSession, role: Role, scope: Scope, mapping: RoleScope) -> None:
    """Delete mapping then role/scope to leave DB pristine."""
    # Merge objects back into session if detached
    mapping = await session.merge(mapping)
    role = await session.merge(role)
    scope = await session.merge(scope)

    await session.delete(mapping)
    await session.delete(role)
    await session.delete(scope)
    await session.commit()


@pytest.mark.asyncio
async def test_health_status_ok():
    """Public health endpoint returns service metadata."""
    async with _get_client() as client:
        response = await client.get("/system/health")

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body.get("status") == "healthy"
    assert body.get("app_name")
    assert body.get("version")


@pytest.mark.asyncio
async def test_seed_status_reports_counts():
    """Seed status exposes seeded flag and integer counts."""
    async with _get_client() as client:
        response = await client.get("/system/seed-status")

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()

    assert isinstance(payload.get("seeded"), bool)
    assert isinstance(payload.get("roles_count"), int)
    assert isinstance(payload.get("scopes_count"), int)
    assert isinstance(payload.get("mappings_count"), int)
    assert payload["seeded"] == (
        payload["roles_count"] > 0 and payload["scopes_count"] > 0)


@pytest.mark.asyncio
async def test_seed_status_reflects_new_data():
    """Seed status counts increase when new role/scope/mapping exist (with cleanup)."""
    async with _get_client() as client:
        baseline = (await client.get("/system/seed-status")).json()

    async with AsyncSession(engine) as session:
        role = scope = mapping = None
        try:
            role, scope, mapping = await _create_role_scope(session)

            async with _get_client() as client:
                updated = (await client.get("/system/seed-status")).json()

            assert updated["roles_count"] >= baseline["roles_count"] + 1
            assert updated["scopes_count"] >= baseline["scopes_count"] + 1
            assert updated["mappings_count"] >= baseline["mappings_count"] + 1
            assert updated["seeded"] is True
        finally:
            if mapping and role and scope:
                await _cleanup_role_scope(session, role, scope, mapping)
