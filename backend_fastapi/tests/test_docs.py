"""
API Documentation Endpoints - Comprehensive Test Suite

================================================================================
COVERAGE MATRIX (3/3 Documentation Endpoints)
================================================================================

1. GET /api/docs
    - Tests: Happy path (Swagger UI accessible without auth)
    - Error cases: 200 OK (public endpoint)
    - Tested in: test_docs_ui_is_public, test_docs_ui_returns_html

2. GET /api/openapi.json
    - Tests: Happy path (OpenAPI schema accessible without auth)
    - Error cases: 200 OK (public endpoint)
    - Tested in: test_openapi_json_is_public, test_openapi_json_has_required_fields,
                    test_openapi_json_includes_all_endpoints

3. GET / (Root Redirect)
    - Tests: Happy path (redirect to /api/docs)
    - Error cases: 307 Temporary Redirect
    - Tested in: test_root_redirects_to_docs

================================================================================
SCENARIO COVERAGE (6 Tests)
================================================================================

ACCESSIBILITY TESTS (2 tests):
✅ test_docs_ui_is_public - Swagger UI accessible without authentication
✅ test_docs_ui_returns_html - Swagger UI returns HTML with proper content type

CONTENT VALIDATION TESTS (3 tests):
✅ test_openapi_json_is_public - OpenAPI schema accessible without authentication
✅ test_openapi_json_has_required_fields - OpenAPI schema has all required fields
✅ test_openapi_json_includes_all_endpoints - OpenAPI schema documents all major endpoints

REDIRECTION TESTS (1 test):
✅ test_root_redirects_to_docs - Root path redirects to /api/docs

================================================================================
TESTING APPROACH
================================================================================

Public Endpoints: No authentication required for documentation endpoints
- /api/docs (Swagger UI)
- /api/openapi.json (OpenAPI schema)
- / (Root, redirects to /api/docs)

No Database Cleanup: Documentation endpoints are read-only and don't create data
- Tests verify static content and schema validity
- No user/resource creation required
- Tests can be run in parallel
"""

import os

import httpx
import pytest
from fastapi import status

BASE_URL = os.getenv("DOCS_BASE_URL", "http://127.0.0.1:8000")


def _get(path: str) -> httpx.Response:
    """Make a GET request to the documentation endpoint without authentication.

    Args:
        path: URL path (relative to BASE_URL)

    Returns: httpx.Response object
    """
    with httpx.Client(base_url=BASE_URL, timeout=10) as client:
        response = client.get(path)
    return response


@pytest.mark.asyncio
async def test_docs_ui_is_public():
    """Swagger UI should be reachable without auth (live server)."""
    response = _get("/api/docs")

    assert response.status_code == status.HTTP_200_OK
    assert "swagger" in response.text.lower()


@pytest.mark.asyncio
async def test_docs_ui_returns_html():
    """Swagger UI should return HTML content type."""
    response = _get("/api/docs")

    assert response.status_code == status.HTTP_200_OK
    assert "text/html" in response.headers.get("content-type", "").lower()
    # Verify essential Swagger UI elements
    assert "swagger-ui" in response.text.lower()
    assert "api" in response.text.lower()


@pytest.mark.asyncio
async def test_openapi_json_is_public():
    """OpenAPI schema should be reachable without auth (live server)."""
    response = _get("/api/openapi.json")

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body.get("openapi")
    assert body.get("info", {}).get("title")


@pytest.mark.asyncio
async def test_openapi_json_has_required_fields():
    """OpenAPI schema should have all required standard fields."""
    response = _get("/api/openapi.json")

    assert response.status_code == status.HTTP_200_OK
    schema = response.json()

    # Required OpenAPI fields
    assert "openapi" in schema, "Missing 'openapi' field"
    assert "info" in schema, "Missing 'info' field"
    assert "title" in schema["info"], "Missing 'info.title' field"
    assert "version" in schema["info"], "Missing 'info.version' field"
    assert "paths" in schema, "Missing 'paths' field"

    # Verify paths is an object with endpoints
    assert isinstance(schema["paths"], dict), "Paths should be a dictionary"
    assert len(schema["paths"]) > 0, "No API endpoints defined in schema"


@pytest.mark.asyncio
async def test_openapi_json_includes_all_endpoints():
    """OpenAPI schema should document all major API endpoints."""
    response = _get("/api/openapi.json")

    assert response.status_code == status.HTTP_200_OK
    schema = response.json()
    paths = schema.get("paths", {})

    # Expected API endpoints
    expected_endpoints = [
        "/api/v1/auth/signup",
        "/api/v1/auth/login",
        "/api/v1/users",
        "/api/v1/societies",
        "/api/v1/issues",
        "/api/v1/assets",
        "/api/v1/amcs",
    ]

    documented_paths = list(paths.keys())
    for endpoint in expected_endpoints:
        assert any(
            endpoint in path for path in documented_paths
        ), f"Endpoint {endpoint} not documented in OpenAPI schema"


@pytest.mark.asyncio
async def test_root_redirects_to_docs():
    """Root path should redirect to /api/docs."""
    with httpx.Client(base_url=BASE_URL, timeout=10, follow_redirects=False) as client:
        response = client.get("/")

    # Should redirect
    assert response.status_code == status.HTTP_307_TEMPORARY_REDIRECT

    # Should redirect to /api/docs
    assert "location" in response.headers
    assert "/api/docs" in response.headers["location"]
