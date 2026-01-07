"""
Society endpoint tests.

This module tests all society management endpoints.
"""

from app.core.security import create_access_token
import pytest
from fastapi import status
from fastapi.testclient import TestClient
from tests.conftest import test_data_ids


class TestSocietyEndpoints:
    """Test class for society endpoints."""

    def test_list_societies(self, client: TestClient, auth_headers):
        """Test listing societies."""
        response = client.get("/api/v1/societies", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), list)

    def test_create_society_as_admin(self, client: TestClient, admin_headers, test_society_data):
        """Test creating society as admin."""
        response = client.post(
            "/api/v1/societies",
            headers=admin_headers,
            json=test_society_data
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == test_society_data["name"]
        assert data["address"] == test_society_data["address"]
        test_data_ids["societies"].append(data["id"])

    def test_create_society_as_member(self, client: TestClient, auth_headers, test_society_data):
        """Test creating society as member (should fail)."""
        response = client.post(
            "/api/v1/societies",
            headers=auth_headers,
            json=test_society_data
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_society(self, client: TestClient, admin_headers, test_society_data):
        """Test getting society details."""
        # Create society
        create_response = client.post(
            "/api/v1/societies",
            headers=admin_headers,
            json=test_society_data
        )
        society_id = create_response.json()["id"]
        test_data_ids["societies"].append(society_id)
        test_data_ids["societies"].append(society_id)

        # Get society
        response = client.get(
            f"/api/v1/societies/{society_id}",
            headers=admin_headers
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["name"] == test_society_data["name"]

    def test_update_society(self, client: TestClient, admin_headers, test_society_data):
        """Test updating society."""
        # Create society
        create_response = client.post(
            "/api/v1/societies",
            headers=admin_headers,
            json=test_society_data
        )
        society_id = create_response.json()["id"]
        test_data_ids["societies"].append(society_id)
        test_data_ids["societies"].append(society_id)

        # Update society
        update_data = {"name": "Updated Society Name"}
        response = client.put(
            f"/api/v1/societies/{society_id}",
            headers=admin_headers,
            json=update_data
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["name"] == "Updated Society Name"

    def test_delete_society_as_developer(self, client: TestClient, developer_headers, test_society_data):
        """Test deleting society as developer."""
        # Create society first (using admin)
        admin_token = create_access_token(
            {"sub": "admin-id", "email": "admin@test.com"})
        admin_hdrs = {"Authorization": f"Bearer {admin_token}"}

        create_response = client.post(
            "/api/v1/societies",
            headers=admin_hdrs,
            json=test_society_data
        )
        society_id = create_response.json()["id"]

        # Delete as developer
        response = client.delete(
            f"/api/v1/societies/{society_id}",
            headers=developer_headers
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_join_society(self, client: TestClient, auth_headers, admin_headers, test_society_data):
        """Test joining a society."""
        # Create society
        create_response = client.post(
            "/api/v1/societies",
            headers=admin_headers,
            json=test_society_data
        )
        society_id = create_response.json()["id"]

        # Join society
        membership_data = {
            "flat_no": "101",
            "wing": "A"
        }
        response = client.post(
            f"/api/v1/societies/{society_id}/join",
            headers=auth_headers,
            json=membership_data
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["approval_status"] == "pending"
        assert data["flat_no"] == "101"

    def test_list_society_members(self, client: TestClient, admin_headers, test_society_data):
        """Test listing society members."""
        # Create society
        create_response = client.post(
            "/api/v1/societies",
            headers=admin_headers,
            json=test_society_data
        )
        society_id = create_response.json()["id"]

        # List members
        response = client.get(
            f"/api/v1/societies/{society_id}/members",
            headers=admin_headers
        )

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), list)

    def test_approve_member(self, client: TestClient, admin_headers, auth_headers, test_society_data):
        """Test approving society membership."""
        # Create society
        create_response = client.post(
            "/api/v1/societies",
            headers=admin_headers,
            json=test_society_data
        )
        society_id = create_response.json()["id"]

        # Join society
        join_response = client.post(
            f"/api/v1/societies/{society_id}/join",
            headers=auth_headers,
            json={"flat_no": "101"}
        )
        user_society_id = join_response.json()["id"]

        # Approve membership
        approval_data = {
            "user_society_id": user_society_id,
            "approved": True
        }
        response = client.post(
            f"/api/v1/societies/{society_id}/approve-member",
            headers=admin_headers,
            json=approval_data
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["approval_status"] == "approved"

    def test_reject_member(self, client: TestClient, admin_headers, auth_headers, test_society_data):
        """Test rejecting society membership."""
        # Create society
        create_response = client.post(
            "/api/v1/societies",
            headers=admin_headers,
            json=test_society_data
        )
        society_id = create_response.json()["id"]

        # Join society
        join_response = client.post(
            f"/api/v1/societies/{society_id}/join",
            headers=auth_headers,
            json={"flat_no": "101"}
        )
        user_society_id = join_response.json()["id"]

        # Reject membership
        approval_data = {
            "user_society_id": user_society_id,
            "approved": False,
            "rejection_reason": "Test rejection"
        }
        response = client.post(
            f"/api/v1/societies/{society_id}/approve-member",
            headers=admin_headers,
            json=approval_data
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["approval_status"] == "rejected"
        assert response.json()["rejection_reason"] == "Test rejection"
