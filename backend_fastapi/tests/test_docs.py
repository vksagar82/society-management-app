"""Docs endpoint accessibility tests against the live server.

Hits the running API over HTTP so requests appear in server logs. Set
DOCS_BASE_URL if your server is not on http://127.0.0.1:8000.
"""

import os

import httpx
import pytest
from fastapi import status

BASE_URL = os.getenv("DOCS_BASE_URL", "http://127.0.0.1:8000")


def _get(path: str) -> httpx.Response:
    with httpx.Client(base_url=BASE_URL, timeout=10) as client:
        response = client.get(path)
    return response


def test_docs_ui_is_public():
    """Swagger UI should be reachable without auth (live server)."""
    response = _get("/api/docs")

    assert response.status_code == status.HTTP_200_OK
    assert "swagger" in response.text.lower()


def test_openapi_json_is_public():
    """OpenAPI schema should be reachable without auth (live server)."""
    response = _get("/api/openapi.json")

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body.get("openapi")
    assert body.get("info", {}).get("title")
