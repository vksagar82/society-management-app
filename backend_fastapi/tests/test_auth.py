"""
Authentication endpoint tests.

This module tests all authentication-related endpoints including
login, signup, token refresh, and password management.
"""

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from tests.conftest import test_data_ids


class TestAuthEndpoints:
    """Test class for authentication endpoints."""

    def test_signup_success(self, client: TestClient, test_user_data):
        """Test successful user signup."""
        response = client.post("/api/v1/auth/signup", json=test_user_data)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert data["full_name"] == test_user_data["full_name"]
        assert "password" not in data
        assert "password_hash" not in data
        test_data_ids["users"].append(data["id"])

    def test_signup_duplicate_email(self, client: TestClient, test_user_data):
        """Test signup with duplicate email."""
        # First signup
        first = client.post("/api/v1/auth/signup", json=test_user_data)
        if first.status_code == status.HTTP_201_CREATED:
            test_data_ids["users"].append(first.json()["id"])

        # Second signup with same email
        response = client.post("/api/v1/auth/signup", json=test_user_data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already exists" in response.json()["detail"].lower()

    def test_signup_weak_password(self, client: TestClient, test_user_data):
        """Test signup with weak password."""
        weak_data = test_user_data.copy()
        weak_data["password"] = "weak"

        response = client.post("/api/v1/auth/signup", json=weak_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_login_success(self, client: TestClient, test_user_data):
        """Test successful login."""
        # Create user first
        created = client.post("/api/v1/auth/signup", json=test_user_data)
        if created.status_code == status.HTTP_201_CREATED:
            test_data_ids["users"].append(created.json()["id"])

        # Login
        login_data = {
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        }
        response = client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["email"] == test_user_data["email"]

    def test_login_invalid_email(self, client: TestClient):
        """Test login with invalid email."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "TestPass123"
        }
        response = client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_invalid_password(self, client: TestClient, test_user_data):
        """Test login with invalid password."""
        # Create user first
        created = client.post("/api/v1/auth/signup", json=test_user_data)
        if created.status_code == status.HTTP_201_CREATED:
            test_data_ids["users"].append(created.json()["id"])

        # Login with wrong password
        login_data = {
            "email": test_user_data["email"],
            "password": "WrongPassword123"
        }
        response = client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_me_authenticated(self, client: TestClient, test_user_data):
        """Test getting current user profile."""
        # Create and login user
        created = client.post("/api/v1/auth/signup", json=test_user_data)
        if created.status_code == status.HTTP_201_CREATED:
            test_data_ids["users"].append(created.json()["id"])
        login_response = client.post("/api/v1/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]

        # Get user profile
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == test_user_data["email"]

    def test_get_me_unauthenticated(self, client: TestClient):
        """Test getting current user without authentication."""
        response = client.get("/api/v1/auth/me")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_refresh_token(self, client: TestClient, test_user_data):
        """Test token refresh."""
        # Create and login user
        created = client.post("/api/v1/auth/signup", json=test_user_data)
        if created.status_code == status.HTTP_201_CREATED:
            test_data_ids["users"].append(created.json()["id"])
        login_response = client.post("/api/v1/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })
        refresh_token = login_response.json()["refresh_token"]

        # Refresh token
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_forgot_password(self, client: TestClient, test_user_data):
        """Test password reset request."""
        # Create user first
        created = client.post("/api/v1/auth/signup", json=test_user_data)
        if created.status_code == status.HTTP_201_CREATED:
            test_data_ids["users"].append(created.json()["id"])

        # Request password reset
        response = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": test_user_data["email"]}
        )

        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.json()

    def test_change_password(self, client: TestClient, test_user_data):
        """Test password change."""
        # Create and login user
        created = client.post("/api/v1/auth/signup", json=test_user_data)
        if created.status_code == status.HTTP_201_CREATED:
            test_data_ids["users"].append(created.json()["id"])
        login_response = client.post("/api/v1/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]

        # Change password
        response = client.post(
            "/api/v1/auth/change-password",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "current_password": test_user_data["password"],
                "new_password": "NewTestPass123"
            }
        )

        assert response.status_code == status.HTTP_200_OK

        # Try login with new password
        new_login = client.post("/api/v1/auth/login", json={
            "email": test_user_data["email"],
            "password": "NewTestPass123"
        })
        assert new_login.status_code == status.HTTP_200_OK
