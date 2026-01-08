"""
User endpoint tests (async, success-path only).

These tests cover happy-path flows for user creation, listing,
retrieval, update, settings, and deletion.
"""

import os
import uuid
from datetime import datetime, timedelta
from pathlib import Path

import asyncio
import httpx
import pytest
from jose import jwt

from config import settings
from tests.conftest import DEV_USER_ID


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


def _make_dev_token() -> str:
    payload = {
        "sub": str(DEV_USER_ID),
        "scope": "developer admin",
        "exp": datetime.utcnow() + timedelta(days=30),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


async def _create_user_and_login(client: httpx.AsyncClient):
    email = f"user-{uuid.uuid4().hex[:8]}@example.com"
    password = "Aa1!pass"
    user_payload = {
        "email": email,
        "phone": f"9{uuid.uuid4().int % 10_000_000_000:010d}"[:10],
        "full_name": "Test User",
        "password": password,
    }

    resp = await client.post("/api/v1/auth/signup", json=user_payload)
    assert resp.status_code == 201, resp.text
    user_id = resp.json()["id"]

    login_resp = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": password}
    )
    assert login_resp.status_code == 200, login_resp.text
    user_token = login_resp.json()["access_token"]
    return user_id, user_token, email


@pytest.mark.asyncio
async def test_users_crud():
    dev_token = _make_dev_token()
    dev_headers = {"Authorization": f"Bearer {dev_token}"}

    async with httpx.AsyncClient(base_url=APP_BASE_URL, timeout=15) as client:
        user_id, user_token, email = await _create_user_and_login(client)
        user_headers = {"Authorization": f"Bearer {user_token}"}

        # List users (admin/dev)
        resp = await client.get("/api/v1/users", headers=dev_headers)
        assert resp.status_code == 200
        users = resp.json()
        assert any(u["email"] == email for u in users)
        await asyncio.sleep(2)

        # Get user detail (self)
        resp = await client.get(f"/api/v1/users/{user_id}", headers=user_headers)
        assert resp.status_code == 200
        assert resp.json()["email"] == email
        await asyncio.sleep(2)

        # Update user (self)
        update_data = {"full_name": "Updated Test User"}
        resp = await client.put(
            f"/api/v1/users/{user_id}",
            headers=user_headers,
            json=update_data,
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["full_name"] == "Updated Test User"
        await asyncio.sleep(2)

        # Get user detail again to verify update
        resp = await client.get(f"/api/v1/users/{user_id}", headers=user_headers)
        assert resp.status_code == 200
        assert resp.json()["full_name"] == "Updated Test User"
        await asyncio.sleep(2)

        # Delete user (admin/dev)
        resp = await client.delete(f"/api/v1/users/{user_id}", headers=dev_headers)
        assert resp.status_code == 204, resp.text


@pytest.mark.asyncio
async def test_user_settings():
    dev_token = _make_dev_token()
    dev_headers = {"Authorization": f"Bearer {dev_token}"}

    async with httpx.AsyncClient(base_url=APP_BASE_URL, timeout=15) as client:
        user_id, user_token, _ = await _create_user_and_login(client)
        user_headers = {"Authorization": f"Bearer {user_token}"}

        # Get settings (self)
        resp = await client.get("/api/v1/users/profile/settings", headers=user_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), dict)
        await asyncio.sleep(2)

        # Update settings (self)
        settings_update = {
            "timezone": "Asia/Kolkata",
            "notifications_enabled": True,
            "email_notifications": True,
        }
        resp = await client.put(
            "/api/v1/users/profile/settings",
            headers=user_headers,
            json=settings_update,
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["timezone"] == "Asia/Kolkata"
        await asyncio.sleep(2)

        # Clean up
        resp = await client.delete(f"/api/v1/users/{user_id}", headers=dev_headers)
        assert resp.status_code == 204, resp.text


@pytest.mark.asyncio
async def test_user_list_filters():
    dev_token = _make_dev_token()
    dev_headers = {"Authorization": f"Bearer {dev_token}"}

    async with httpx.AsyncClient(base_url=APP_BASE_URL, timeout=15) as client:
        user_id, user_token, email = await _create_user_and_login(client)

        # List users with search filter
        resp = await client.get(
            f"/api/v1/users?search={email.split('@')[0]}", headers=dev_headers
        )
        assert resp.status_code == 200
        users = resp.json()
        assert any(u["email"] == email for u in users)
        await asyncio.sleep(2)

        # Clean up
        resp = await client.delete(f"/api/v1/users/{user_id}", headers=dev_headers)
        assert resp.status_code == 204, resp.text


@pytest.mark.asyncio
async def test_user_avatar():
    dev_token = _make_dev_token()
    dev_headers = {"Authorization": f"Bearer {dev_token}"}

    async with httpx.AsyncClient(base_url=APP_BASE_URL, timeout=15) as client:
        user_id, user_token, _ = await _create_user_and_login(client)
        user_headers = {"Authorization": f"Bearer {user_token}"}

        # Update avatar
        avatar_url = "https://example.com/avatar.jpg"
        resp = await client.post(
            "/api/v1/users/profile/avatar",
            headers=user_headers,
            params={"avatar_url": avatar_url}
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["avatar_url"] == avatar_url
        await asyncio.sleep(2)

        # Verify avatar persisted
        resp = await client.get(f"/api/v1/users/{user_id}", headers=user_headers)
        assert resp.status_code == 200
        assert resp.json()["avatar_url"] == avatar_url
        await asyncio.sleep(2)

        # Clean up
        resp = await client.delete(f"/api/v1/users/{user_id}", headers=dev_headers)
        assert resp.status_code == 204, resp.text
