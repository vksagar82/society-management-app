"""
Society endpoint tests.

This module tests all society management endpoints.
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


@pytest.mark.asyncio
async def test_societies_crud():
    """Test society CRUD operations."""
    token = _make_dev_token()
    headers = {"Authorization": f"Bearer {token}"}
    society_name = f"Society-{uuid.uuid4().hex[:8]}"

    async with httpx.AsyncClient(base_url=APP_BASE_URL, timeout=15) as client:
        # POST society (create)
        society_data = {
            "name": society_name,
            "address": "123 Test Street",
            "city": "Test City",
            "state": "Test State",
            "pincode": "123456"
        }
        resp = await client.post("/api/v1/societies", json=society_data, headers=headers)
        assert resp.status_code == 201, resp.text
        society_id = resp.json()["id"]
        await asyncio.sleep(2)

        # GET societies (list)
        resp = await client.get("/api/v1/societies", headers=headers)
        assert resp.status_code == 200
        societies = resp.json()
        assert any(s["name"] == society_name for s in societies)
        await asyncio.sleep(2)

        # GET society (detail)
        resp = await client.get(f"/api/v1/societies/{society_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["name"] == society_name
        await asyncio.sleep(2)

        # PUT society (update)
        update_data = {
            "name": f"{society_name}-Updated",
            "address": "456 Updated Street",
            "city": "Updated City",
            "state": "Updated State",
            "pincode": "654321"
        }
        resp = await client.put(f"/api/v1/societies/{society_id}", json=update_data, headers=headers)
        assert resp.status_code == 200, resp.text
        assert resp.json()["name"] == f"{society_name}-Updated"
        assert resp.json()["city"] == "Updated City"
        await asyncio.sleep(2)

        # Verify updated society in list
        resp = await client.get("/api/v1/societies", headers=headers)
        assert resp.status_code == 200
        societies = resp.json()
        updated_society = next(
            (s for s in societies if s["id"] == society_id), None)
        assert updated_society is not None
        assert updated_society["name"] == f"{society_name}-Updated"
        await asyncio.sleep(2)

        # DELETE society
        resp = await client.delete(f"/api/v1/societies/{society_id}", headers=headers)
        assert resp.status_code == 204, resp.text
        await asyncio.sleep(2)


@pytest.mark.asyncio
async def test_society_membership():
    """Test society membership operations (list members)."""
    token = _make_dev_token()
    headers = {"Authorization": f"Bearer {token}"}
    society_name = f"Society-{uuid.uuid4().hex[:8]}"

    async with httpx.AsyncClient(base_url=APP_BASE_URL, timeout=15) as client:
        # Create society (creator is automatically added as admin)
        society_data = {
            "name": society_name,
            "address": "123 Test Street",
            "city": "Test City",
            "state": "Test State",
            "pincode": "123456"
        }
        resp = await client.post("/api/v1/societies", json=society_data, headers=headers)
        assert resp.status_code == 201, resp.text
        society_id = resp.json()["id"]
        await asyncio.sleep(2)

        # List society members (should include the creator as admin)
        resp = await client.get(f"/api/v1/societies/{society_id}/members", headers=headers)
        assert resp.status_code == 200
        members = resp.json()
        assert len(members) >= 1  # At least the creator
        # Creator should be admin with approved status
        creator_member = next(
            (m for m in members if m["role"] == "admin"), None)
        assert creator_member is not None
        assert creator_member["approval_status"] == "approved"
        await asyncio.sleep(2)

        # Verify we can get the society details
        resp = await client.get(f"/api/v1/societies/{society_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["name"] == society_name
        await asyncio.sleep(2)

        # Clean up - delete society
        resp = await client.delete(f"/api/v1/societies/{society_id}", headers=headers)
        assert resp.status_code == 204, resp.text
        await asyncio.sleep(2)


@pytest.mark.asyncio
async def test_society_list_and_details():
    """Test retrieving society list and details."""
    token = _make_dev_token()
    headers = {"Authorization": f"Bearer {token}"}
    society_name = f"Society-{uuid.uuid4().hex[:8]}"

    async with httpx.AsyncClient(base_url=APP_BASE_URL, timeout=15) as client:
        # Create society
        society_data = {
            "name": society_name,
            "address": "123 Test Street",
            "city": "Test City",
            "state": "Test State",
            "pincode": "123456"
        }
        resp = await client.post("/api/v1/societies", json=society_data, headers=headers)
        assert resp.status_code == 201, resp.text
        society_id = resp.json()["id"]
        await asyncio.sleep(2)

        # Get all societies
        resp = await client.get("/api/v1/societies", headers=headers)
        assert resp.status_code == 200
        societies = resp.json()
        assert any(s["id"] == society_id for s in societies)
        await asyncio.sleep(2)

        # Get specific society details
        resp = await client.get(f"/api/v1/societies/{society_id}", headers=headers)
        assert resp.status_code == 200
        society_details = resp.json()
        assert society_details["name"] == society_name
        assert society_details["city"] == "Test City"
        await asyncio.sleep(2)

        # Get society members
        resp = await client.get(f"/api/v1/societies/{society_id}/members", headers=headers)
        assert resp.status_code == 200
        members = resp.json()
        assert len(members) >= 1
        await asyncio.sleep(2)

        # Clean up - delete society
        resp = await client.delete(f"/api/v1/societies/{society_id}", headers=headers)
        assert resp.status_code == 204, resp.text
        await asyncio.sleep(2)


@pytest.mark.asyncio
async def test_society_join():
    """Test joining a society."""
    dev_token = _make_dev_token()
    dev_headers = {"Authorization": f"Bearer {dev_token}"}
    society_name = f"Society-{uuid.uuid4().hex[:8]}"

    async with httpx.AsyncClient(base_url=APP_BASE_URL, timeout=15) as client:
        # Create society (as dev/admin)
        society_data = {
            "name": society_name,
            "address": "123 Test Street",
            "city": "Test City",
            "state": "Test State",
            "pincode": "123456"
        }
        resp = await client.post("/api/v1/societies", json=society_data, headers=dev_headers)
        assert resp.status_code == 201, resp.text
        society_id = resp.json()["id"]
        await asyncio.sleep(2)

        # Create a regular user to join
        signup_data = {
            "email": f"joiner_{uuid.uuid4().hex[:8]}@example.com",
            "phone": f"91{uuid.uuid4().hex[:8][:8]}",
            "full_name": "Society Joiner",
            "password": "JoinPass123"
        }
        resp = await client.post("/api/v1/auth/signup", json=signup_data)
        assert resp.status_code == 201, resp.text
        user_id = resp.json()["id"]
        await asyncio.sleep(2)

        # Login as new user
        login_data = {
            "email": signup_data["email"],
            "password": signup_data["password"]
        }
        resp = await client.post("/api/v1/auth/login", json=login_data)
        assert resp.status_code == 200, resp.text
        user_token = resp.json()["access_token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}
        await asyncio.sleep(2)

        # Join society (as regular user)
        resp = await client.post(f"/api/v1/societies/{society_id}/join", headers=user_headers)
        assert resp.status_code == 201, resp.text
        membership = resp.json()
        assert membership["user_id"] == user_id
        assert membership["society_id"] == society_id
        await asyncio.sleep(2)

        # Verify membership in members list
        resp = await client.get(f"/api/v1/societies/{society_id}/members", headers=dev_headers)
        assert resp.status_code == 200
        members = resp.json()
        joiner = next((m for m in members if m["user_id"] == user_id), None)
        assert joiner is not None
        await asyncio.sleep(2)

        # Clean up - delete user first
        resp = await client.delete(f"/api/v1/users/{user_id}", headers=dev_headers)
        assert resp.status_code == 204, resp.text
        await asyncio.sleep(2)

        # Clean up - delete society
        resp = await client.delete(f"/api/v1/societies/{society_id}", headers=dev_headers)
        assert resp.status_code == 204, resp.text
        await asyncio.sleep(2)


@pytest.mark.asyncio
async def test_society_approve_member():
    """Test approving and rejecting membership requests."""
    dev_token = _make_dev_token()
    dev_headers = {"Authorization": f"Bearer {dev_token}"}
    society_name = f"Society-{uuid.uuid4().hex[:8]}"

    async with httpx.AsyncClient(base_url=APP_BASE_URL, timeout=15) as client:
        # Create society
        society_data = {
            "name": society_name,
            "address": "123 Test Street",
            "city": "Test City",
            "state": "Test State",
            "pincode": "123456"
        }
        resp = await client.post("/api/v1/societies", json=society_data, headers=dev_headers)
        assert resp.status_code == 201, resp.text
        society_id = resp.json()["id"]
        await asyncio.sleep(2)

        # Create and join as a regular user
        signup_data = {
            "email": f"applicant_{uuid.uuid4().hex[:8]}@example.com",
            "phone": f"92{uuid.uuid4().hex[:8][:8]}",
            "full_name": "Society Applicant",
            "password": "ApplyPass123"
        }
        resp = await client.post("/api/v1/auth/signup", json=signup_data)
        assert resp.status_code == 201, resp.text
        user_id = resp.json()["id"]
        await asyncio.sleep(2)

        login_data = {
            "email": signup_data["email"],
            "password": signup_data["password"]
        }
        resp = await client.post("/api/v1/auth/login", json=login_data)
        assert resp.status_code == 200, resp.text
        user_token = resp.json()["access_token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}
        await asyncio.sleep(2)

        # User joins society
        resp = await client.post(f"/api/v1/societies/{society_id}/join", headers=user_headers)
        assert resp.status_code == 201, resp.text
        user_society_id = resp.json()["id"]
        await asyncio.sleep(2)

        # Approve the membership request (as dev/admin)
        approval_data = {"user_society_id": user_society_id, "approved": True}
        resp = await client.post(
            f"/api/v1/societies/{society_id}/approve",
            json=approval_data,
            headers=dev_headers
        )
        assert resp.status_code == 200, resp.text
        updated_membership = resp.json()
        assert updated_membership["approval_status"] == "approved"
        await asyncio.sleep(2)

        # Verify approved status in members list
        resp = await client.get(f"/api/v1/societies/{society_id}/members", headers=dev_headers)
        assert resp.status_code == 200
        members = resp.json()
        applicant = next((m for m in members if m["user_id"] == user_id), None)
        assert applicant is not None
        assert applicant["approval_status"] == "approved"
        await asyncio.sleep(2)

        # Clean up - delete user first
        resp = await client.delete(f"/api/v1/users/{user_id}", headers=dev_headers)
        assert resp.status_code == 204, resp.text
        await asyncio.sleep(2)

        # Clean up - delete society
        resp = await client.delete(f"/api/v1/societies/{society_id}", headers=dev_headers)
        assert resp.status_code == 204, resp.text
        await asyncio.sleep(2)
