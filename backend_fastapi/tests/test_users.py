"""
User endpoint tests.

This module tests all user management endpoints.
"""

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from tests.conftest import test_data_ids


class TestUserEndpoints:
    """Test class for user endpoints."""

    def test_list_users_as_admin(self, client: TestClient, admin_headers):
        """Test listing users as admin."""
        response = client.get("/api/v1/users", headers=admin_headers)

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), list)

    def test_list_users_as_member(self, client: TestClient, auth_headers):
        """Test listing users as member (should be forbidden)."""
        response = client.get("/api/v1/users", headers=auth_headers)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_list_users_unauthenticated(self, client: TestClient):
        """Test listing users without authentication."""
        response = client.get("/api/v1/users")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_list_users_with_search(self, client: TestClient, admin_headers):
        """Test searching users."""
        response = client.get(
            "/api/v1/users?search=test",
            headers=admin_headers
        )

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), list)

    def test_list_users_with_pagination(self, client: TestClient, admin_headers):
        """Test user list pagination."""
        response = client.get(
            "/api/v1/users?skip=0&limit=10",
            headers=admin_headers
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) <= 10

    def test_get_user_self(self, client: TestClient, test_user_data):
        """Test getting own user profile."""
        # Create and login user
        signup_response = client.post(
            "/api/v1/auth/signup", json=test_user_data)
        if signup_response.status_code == status.HTTP_201_CREATED:
            user_id = signup_response.json()["id"]
            test_data_ids["users"].append(user_id)

        login_response = client.post("/api/v1/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]

        # Get own profile
        response = client.get(
            f"/api/v1/users/{user_id}",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["email"] == test_user_data["email"]

    def test_get_user_not_found(self, client: TestClient, admin_headers):
        """Test getting non-existent user."""
        fake_uuid = "00000000-0000-0000-0000-000000000099"
        response = client.get(
            f"/api/v1/users/{fake_uuid}",
            headers=admin_headers
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_user_self(self, client: TestClient, test_user_data):
        """Test updating own user profile."""
        # Create and login user
        signup_response = client.post(
            "/api/v1/auth/signup", json=test_user_data)
        if signup_response.status_code == status.HTTP_201_CREATED:
            user_id = signup_response.json()["id"]
            test_data_ids["users"].append(user_id)

        login_response = client.post("/api/v1/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]

        # Update profile
        update_data = {"full_name": "Updated Name"}
        response = client.put(
            f"/api/v1/users/{user_id}",
            headers={"Authorization": f"Bearer {token}"},
            json=update_data
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["full_name"] == "Updated Name"

    def test_update_user_unauthorized(self, client: TestClient, auth_headers):
        """Test updating another user's profile (should fail)."""
        fake_uuid = "00000000-0000-0000-0000-000000000099"
        update_data = {"full_name": "Hacker Name"}

        response = client.put(
            f"/api/v1/users/{fake_uuid}",
            headers=auth_headers,
            json=update_data
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_delete_user_as_developer(self, client: TestClient, developer_headers):
        """Test deleting user as developer."""
        # Create test user
        test_data = {
            "email": "delete@example.com",
            "phone": "1111111111",
            "full_name": "Delete Me",
            "password": "TestPass123"
        }
        signup_response = client.post("/api/v1/auth/signup", json=test_data)
        if signup_response.status_code == status.HTTP_201_CREATED:
            user_id = signup_response.json()["id"]
            test_data_ids["users"].append(user_id)

        # Delete user
        response = client.delete(
            f"/api/v1/users/{user_id}",
            headers=developer_headers
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_delete_user_as_admin(self, client: TestClient, admin_headers):
        """Test deleting user as admin (should be forbidden)."""
        fake_uuid = "00000000-0000-0000-0000-000000000099"
        response = client.delete(
            f"/api/v1/users/{fake_uuid}",
            headers=admin_headers
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_toggle_user_active(self, client: TestClient, admin_headers, test_user_data):
        """Test toggling user active status."""
        # Create test user
        signup_response = client.post(
            "/api/v1/auth/signup", json=test_user_data)
        if signup_response.status_code == status.HTTP_201_CREATED:
            user_id = signup_response.json()["id"]
            test_data_ids["users"].append(user_id)

        # Toggle active status
        response = client.post(
            f"/api/v1/users/{user_id}/toggle-active",
            headers=admin_headers
        )

        assert response.status_code == status.HTTP_200_OK
        # User should now be inactive
        assert response.json()["is_active"] == False

    def test_get_user_settings(self, client: TestClient, test_user_data):
        """Test getting user settings."""
        # Create and login user
        signup_response = client.post(
            "/api/v1/auth/signup", json=test_user_data)
        if signup_response.status_code == status.HTTP_201_CREATED:
            user_id = signup_response.json()["id"]
            test_data_ids["users"].append(user_id)

        login_response = client.post("/api/v1/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]

        # Get settings
        response = client.get(
            f"/api/v1/users/{user_id}/settings",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), dict)

    def test_update_user_settings(self, client: TestClient, test_user_data):
        """Test updating user settings."""
        # Create and login user
        signup_response = client.post(
            "/api/v1/auth/signup", json=test_user_data)
        if signup_response.status_code == status.HTTP_201_CREATED:
            user_id = signup_response.json()["id"]
            test_data_ids["users"].append(user_id)

        login_response = client.post("/api/v1/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]

        # Update settings
        settings_data = {
            "timezone": "Asia/Kolkata",
            "notifications_enabled": True
        }
        response = client.put(
            f"/api/v1/users/{user_id}/settings",
            headers={"Authorization": f"Bearer {token}"},
            json=settings_data
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["timezone"] == "Asia/Kolkata"
