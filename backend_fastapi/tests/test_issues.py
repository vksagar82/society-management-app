"""
Issue endpoint tests.

This module verifies CRUD for issues with member access and cleanup tracking.
"""

from uuid import uuid4
from fastapi import status
from fastapi.testclient import TestClient
from tests.conftest import test_data_ids


class TestIssueEndpoints:
    """Tests for issue lifecycle endpoints."""

    def _create_society_and_membership(self, client: TestClient, admin_headers, auth_headers, test_society_data):
        """Create a society, join it as member, and approve membership."""
        create_response = client.post(
            "/api/v1/societies",
            headers=admin_headers,
            json=test_society_data,
        )
        assert create_response.status_code == status.HTTP_201_CREATED
        society_id = create_response.json()["id"]
        test_data_ids["societies"].append(society_id)

        join_response = client.post(
            f"/api/v1/societies/{society_id}/join",
            headers=auth_headers,
            json={"flat_no": "101", "wing": "A"},
        )
        assert join_response.status_code == status.HTTP_201_CREATED
        membership_id = join_response.json()["id"]
        test_data_ids["user_societies"].append(membership_id)

        approve_response = client.post(
            f"/api/v1/societies/{society_id}/approve-member",
            headers=admin_headers,
            json={"user_society_id": membership_id, "approved": True},
        )
        assert approve_response.status_code == status.HTTP_200_OK

        return society_id

    def _create_issue(self, client: TestClient, headers, society_id):
        """Create a single issue and track id."""
        payload = {
            "title": f"Leak report {uuid4().hex[:6]}",
            "description": "Water leakage observed near lobby",
            "category": "Maintenance",
            "priority": "medium",
            "location": "Block A",
            "society_id": society_id,
            "images": ["http://example.com/img.jpg"],
            "attachment_urls": [],
        }
        response = client.post("/api/v1/issues", headers=headers, json=payload)
        assert response.status_code == status.HTTP_201_CREATED
        issue_id = response.json()["id"]
        test_data_ids["issues"].append(issue_id)
        return issue_id

    def test_create_issue(self, client: TestClient, admin_headers, auth_headers, test_society_data):
        """Member can create an issue within their approved society."""
        society_id = self._create_society_and_membership(
            client, admin_headers, auth_headers, test_society_data)

        response = client.post(
            "/api/v1/issues",
            headers=auth_headers,
            json={
                "title": f"Power outage {uuid4().hex[:6]}",
                "description": "Power outage reported in parking area",
                "category": "Electrical",
                "priority": "high",
                "location": "Basement",
                "society_id": society_id,
                "images": [],
                "attachment_urls": [],
            },
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["society_id"] == society_id
        assert data["status"] == "open"
        test_data_ids["issues"].append(data["id"])

    def test_list_issues(self, client: TestClient, admin_headers, auth_headers, test_society_data):
        """List issues for member's society."""
        society_id = self._create_society_and_membership(
            client, admin_headers, auth_headers, test_society_data)
        issue_id = self._create_issue(client, auth_headers, society_id)

        response = client.get("/api/v1/issues", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        ids = [item["id"] for item in response.json()]
        assert issue_id in ids

    def test_get_issue(self, client: TestClient, admin_headers, auth_headers, test_society_data):
        """Fetch a single issue by id."""
        society_id = self._create_society_and_membership(
            client, admin_headers, auth_headers, test_society_data)
        issue_id = self._create_issue(client, auth_headers, society_id)

        response = client.get(
            f"/api/v1/issues/{issue_id}", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["id"] == issue_id

    def test_update_issue(self, client: TestClient, admin_headers, auth_headers, test_society_data):
        """Reporter can update their issue."""
        society_id = self._create_society_and_membership(
            client, admin_headers, auth_headers, test_society_data)
        issue_id = self._create_issue(client, auth_headers, society_id)

        response = client.put(
            f"/api/v1/issues/{issue_id}",
            headers=auth_headers,
            json={"status": "in_progress", "priority": "high"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "in_progress"

    def test_delete_issue(self, client: TestClient, admin_headers, auth_headers, developer_headers, test_society_data):
        """Developer can delete an issue for cleanup."""
        society_id = self._create_society_and_membership(
            client, admin_headers, auth_headers, test_society_data)
        issue_id = self._create_issue(client, auth_headers, society_id)

        response = client.delete(
            f"/api/v1/issues/{issue_id}", headers=developer_headers)

        assert response.status_code == status.HTTP_204_NO_CONTENT
