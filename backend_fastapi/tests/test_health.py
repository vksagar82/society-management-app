"""Health endpoint accessibility tests against the live server.

Hits the running API over HTTP so requests appear in server logs. Set
HEALTH_BASE_URL if your server is not on http://127.0.0.1:8000.
"""

import os

import httpx
from fastapi import status

BASE_URL = os.getenv("HEALTH_BASE_URL", "http://127.0.0.1:8000")


def _get_health():
    with httpx.Client(base_url=BASE_URL, timeout=10) as client:
        return client.get("/health")


def test_health_ok():
    """Health endpoint should respond without auth (live server)."""
    response = _get_health()

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body.get("status") == "healthy"
    assert "app_name" in body
    assert "version" in body
