"""
Asset endpoint tests.

This module covers asset categories and asset CRUD with cleanup tracking.
"""

from uuid import uuid4
from fastapi import status
from fastapi.testclient import TestClient
from tests.conftest import test_data_ids


class TestAssetEndpoints:
    """Tests for asset and category endpoints."""

    def _create_society(self, client: TestClient, admin_headers, test_society_data):
        """Create a society and track id."""
        response = client.post(
            "/api/v1/societies",
            headers=admin_headers,
            json=test_society_data,
        )
        assert response.status_code == status.HTTP_201_CREATED
        society_id = response.json()["id"]
        test_data_ids["societies"].append(society_id)
        return society_id

    def _create_category(self, client: TestClient, developer_headers, society_id):
        """Create an asset category and track id."""
        payload = {
            "name": f"HVAC-{uuid4().hex[:5]}",
            "description": "HVAC equipment",
            "society_id": society_id,
        }
        response = client.post(
            "/api/v1/assets/categories",
            headers=developer_headers,
            json=payload,
        )
        assert response.status_code == status.HTTP_201_CREATED
        category_id = response.json()["id"]
        test_data_ids["asset_categories"].append(category_id)
        return category_id

    def _create_asset(self, client: TestClient, developer_headers, society_id, category_id):
        """Create an asset and track id."""
        payload = {
            "name": f"Pump-{uuid4().hex[:5]}",
            "description": "Water pump",
            "society_id": society_id,
            "category_id": category_id,
            "purchase_cost": 12000,
            "asset_code": f"AS-{uuid4().hex[:6]}",
            "maintenance_frequency": "monthly",
            "location": "Basement",
        }
        response = client.post(
            "/api/v1/assets",
            headers=developer_headers,
            json=payload,
        )
        assert response.status_code == status.HTTP_201_CREATED
        asset_id = response.json()["id"]
        test_data_ids["assets"].append(asset_id)
        return asset_id

    def test_create_category_and_asset(self, client: TestClient, admin_headers, developer_headers, test_society_data):
        """Developer can create asset category and asset."""
        society_id = self._create_society(
            client, admin_headers, test_society_data)
        category_id = self._create_category(
            client, developer_headers, society_id)

        response = client.post(
            "/api/v1/assets",
            headers=developer_headers,
            json={
                "name": "Generator",
                "description": "Backup generator",
                "society_id": society_id,
                "category_id": category_id,
                "purchase_cost": 50000,
                "asset_code": f"GEN-{uuid4().hex[:6]}",
                "maintenance_frequency": "quarterly",
                "location": "Roof",
            },
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        test_data_ids["assets"].append(data["id"])
        assert data["category_id"] == category_id

    def test_list_assets(self, client: TestClient, admin_headers, developer_headers, test_society_data):
        """List assets for a society."""
        society_id = self._create_society(
            client, admin_headers, test_society_data)
        category_id = self._create_category(
            client, developer_headers, society_id)
        asset_id = self._create_asset(
            client, developer_headers, society_id, category_id)

        response = client.get(
            f"/api/v1/assets?society_id={society_id}",
            headers=developer_headers,
        )

        assert response.status_code == status.HTTP_200_OK
        ids = [item["id"] for item in response.json()]
        assert asset_id in ids

    def test_get_asset(self, client: TestClient, admin_headers, developer_headers, test_society_data):
        """Fetch asset details by id."""
        society_id = self._create_society(
            client, admin_headers, test_society_data)
        category_id = self._create_category(
            client, developer_headers, society_id)
        asset_id = self._create_asset(
            client, developer_headers, society_id, category_id)

        response = client.get(
            f"/api/v1/assets/{asset_id}", headers=developer_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["id"] == asset_id

    def test_update_asset(self, client: TestClient, admin_headers, developer_headers, test_society_data):
        """Developer can update asset fields."""
        society_id = self._create_society(
            client, admin_headers, test_society_data)
        category_id = self._create_category(
            client, developer_headers, society_id)
        asset_id = self._create_asset(
            client, developer_headers, society_id, category_id)

        response = client.put(
            f"/api/v1/assets/{asset_id}",
            headers=developer_headers,
            json={"status": "maintenance", "name": "Updated Pump"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "maintenance"

    def test_delete_asset(self, client: TestClient, admin_headers, developer_headers, test_society_data):
        """Developer can delete asset for cleanup."""
        society_id = self._create_society(
            client, admin_headers, test_society_data)
        category_id = self._create_category(
            client, developer_headers, society_id)
        asset_id = self._create_asset(
            client, developer_headers, society_id, category_id)

        response = client.delete(
            f"/api/v1/assets/{asset_id}", headers=developer_headers)

        assert response.status_code == status.HTTP_204_NO_CONTENT
