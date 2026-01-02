"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/Badge";
import { useAuth } from "@/lib/auth/context";

interface Asset {
  id: string;
  name: string;
  category: string;
  description: string;
  purchase_date: string;
  warranty_expiry_date: string;
  location: string;
  asset_code: string;
  status: string;
  last_maintenance_date: string;
  next_maintenance_date: string;
}

export default function AssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchAssets();
  }, [filter]);

  const fetchAssets = async () => {
    try {
      const params = new URLSearchParams();
      if (user?.society_id) params.append("society_id", user.society_id);
      if (filter) params.append("status", filter);

      const url = params.toString() ? `/api/assets?${params}` : "/api/assets";
      const res = await fetch(url);
      const data = await res.json();
      setAssets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch assets:", error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const payload: any = {
        name: formData.get("name"),
        category: formData.get("category"),
        description: formData.get("description"),
        purchase_date: formData.get("purchase_date"),
        warranty_expiry_date: formData.get("warranty_expiry_date"),
        location: formData.get("location"),
        asset_code: formData.get("asset_code"),
      };

      if (user?.society_id) payload.society_id = user.society_id;
      if (user?.id) payload.created_by = user.id;

      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowForm(false);
        fetchAssets();
      }
    } catch (error) {
      console.error("Failed to create asset:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Asset Tracking</h1>
            <p className="mt-2 text-gray-600">
              Manage and track all society assets
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + Add Asset
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">Add New Asset</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option>Elevator</option>
                    <option>CCTV</option>
                    <option>Generator</option>
                    <option>Water Pump</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    name="purchase_date"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty Expiry
                  </label>
                  <input
                    type="date"
                    name="warranty_expiry_date"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    placeholder="e.g., Building A, Basement"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset Code
                  </label>
                  <input
                    type="text"
                    name="asset_code"
                    placeholder="e.g., AST-001"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
                >
                  Add Asset
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter("")}
            className={`px-4 py-2 rounded-lg font-medium ${
              !filter
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === "active"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("maintenance")}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === "maintenance"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border"
            }`}
          >
            In Maintenance
          </button>
          <button
            onClick={() => setFilter("inactive")}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === "inactive"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border"
            }`}
          >
            Inactive
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : assets.length === 0 ? (
          <div className="text-center py-12 text-gray-600">No assets found</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {asset.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {asset.category}
                    </p>
                  </div>
                  <StatusBadge status={asset.status} />
                </div>

                {asset.description && (
                  <p className="text-sm text-gray-600 mb-4">
                    {asset.description}
                  </p>
                )}

                <div className="space-y-2 text-sm mb-4">
                  {asset.location && (
                    <p>
                      <span className="text-gray-500">📍 Location:</span>
                      <span className="font-medium ml-2">{asset.location}</span>
                    </p>
                  )}
                  {asset.asset_code && (
                    <p>
                      <span className="text-gray-500">🏷️ Code:</span>
                      <span className="font-medium ml-2">
                        {asset.asset_code}
                      </span>
                    </p>
                  )}
                  {asset.warranty_expiry_date && (
                    <p>
                      <span className="text-gray-500">📅 Warranty:</span>
                      <span className="font-medium ml-2">
                        {new Date(
                          asset.warranty_expiry_date
                        ).toLocaleDateString()}
                      </span>
                    </p>
                  )}
                  {asset.next_maintenance_date && (
                    <p>
                      <span className="text-gray-500">
                        🔧 Next Maintenance:
                      </span>
                      <span className="font-medium ml-2">
                        {new Date(
                          asset.next_maintenance_date
                        ).toLocaleDateString()}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
