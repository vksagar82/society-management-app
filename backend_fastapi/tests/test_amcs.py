"""
AMC endpoint tests.

This module covers AMC CRUD flows with associated asset setup and cleanup tracking.
"""

from uuid import uuid4
from fastapi import status
from fastapi.testclient import TestClient
from tests.conftest import test_data_ids


class TestAMCEndpoints:
    """Tests for AMC endpoints."""

    def _create_society(self, client: TestClient, admin_headers, test_society_data):
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
        payload = {
            "name": f"Electrical-{uuid4().hex[:5]}",
            "description": "Electrical equipment",
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
        payload = {
            "name": f"Elevator-{uuid4().hex[:5]}",
            "description": "Lift equipment",
            "society_id": society_id,
            "category_id": category_id,
            "purchase_cost": 150000,
            "asset_code": f"EL-{uuid4().hex[:6]}",
            "maintenance_frequency": "monthly",
            "location": "Tower A",
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

    def _create_amc(self, client: TestClient, developer_headers, society_id, asset_id):
        payload = {
            "society_id": society_id,
            "vendor_name": "Reliable Services",
            "service_type": "HVAC",
            "contract_start_date": "2026-01-01",
            "contract_end_date": "2026-12-31",
            "annual_cost": 25000,
            "currency": "INR",
            "maintenance_frequency": "monthly",
            "maintenance_interval_months": 1,
            "contact_person": "Vendor Lead",
            "contact_phone": "9876500000",
            "notes": "Test AMC",
            "vendor_code": f"VN-{uuid4().hex[:4]}",
            "asset_id": asset_id,
        }
        response = client.post(
            "/api/v1/amcs",
            headers=developer_headers,
            json=payload,
        )
        assert response.status_code == status.HTTP_201_CREATED
        amc_id = response.json()["id"]
        test_data_ids["amcs"].append(amc_id)
        return amc_id

    def test_create_amc(self, client: TestClient, admin_headers, developer_headers, test_society_data):
        """Developer can create AMC tied to an asset."""
        society_id = self._create_society(
            client, admin_headers, test_society_data)
        category_id = self._create_category(
            client, developer_headers, society_id)
        asset_id = self._create_asset(
            client, developer_headers, society_id, category_id)

        response = client.post(
            "/api/v1/amcs",
            headers=developer_headers,
            json={
                "society_id": society_id,
                "vendor_name": "Cooling Corp",
                "service_type": "HVAC",
                "contract_start_date": "2026-01-01",
                "contract_end_date": "2026-12-31",
                "annual_cost": 10000,
                "currency": "INR",
                "maintenance_frequency": "quarterly",
                "contact_person": "Mr. Cool",
                "contact_phone": "9999988888",
                "asset_id": asset_id,
            },
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        test_data_ids["amcs"].append(data["id"])
        assert data["society_id"] == society_id

    def test_list_amcs(self, client: TestClient, admin_headers, developer_headers, test_society_data):
        """List AMCs for a society."""
        society_id = self._create_society(
            client, admin_headers, test_society_data)
        category_id = self._create_category(
            client, developer_headers, society_id)
        asset_id = self._create_asset(
            client, developer_headers, society_id, category_id)
        amc_id = self._create_amc(
            client, developer_headers, society_id, asset_id)

        response = client.get(
            f"/api/v1/amcs?society_id={society_id}",
            headers=developer_headers,
        )

        assert response.status_code == status.HTTP_200_OK
        ids = [item["id"] for item in response.json()]
        assert amc_id in ids

    def test_get_amc(self, client: TestClient, admin_headers, developer_headers, test_society_data):
        """Fetch AMC details by id."""
        society_id = self._create_society(
            client, admin_headers, test_society_data)
        category_id = self._create_category(
            client, developer_headers, society_id)
        asset_id = self._create_asset(
            client, developer_headers, society_id, category_id)
        amc_id = self._create_amc(
            client, developer_headers, society_id, asset_id)

        response = client.get(
            f"/api/v1/amcs/{amc_id}", headers=developer_headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["id"] == amc_id

    def test_update_amc(self, client: TestClient, admin_headers, developer_headers, test_society_data):
        """Developer can update AMC fields."""
        society_id = self._create_society(
            client, admin_headers, test_society_data)
        category_id = self._create_category(
            client, developer_headers, society_id)
        asset_id = self._create_asset(
            client, developer_headers, society_id, category_id)
        amc_id = self._create_amc(
            client, developer_headers, society_id, asset_id)

        response = client.put(
            f"/api/v1/amcs/{amc_id}",
            headers=developer_headers,
            json={"status": "pending_renewal", "notes": "Update test"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "pending_renewal"

    def test_delete_amc(self, client: TestClient, admin_headers, developer_headers, test_society_data):
        """Developer can delete AMC for cleanup."""
        society_id = self._create_society(
            client, admin_headers, test_society_data)
        category_id = self._create_category(
            client, developer_headers, society_id)
        asset_id = self._create_asset(
            client, developer_headers, society_id, category_id)
        amc_id = self._create_amc(
            client, developer_headers, society_id, asset_id)

        response = client.delete(
            f"/api/v1/amcs/{amc_id}", headers=developer_headers)

        assert response.status_code == status.HTTP_204_NO_CONTENT
