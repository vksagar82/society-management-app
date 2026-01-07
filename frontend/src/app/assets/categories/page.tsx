"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";

interface Category {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export default function AssetCategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.society_id) return;
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.society_id]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
      const params = new URLSearchParams();
      if (user?.society_id) params.append("society_id", user.society_id);

      const res = await fetch(`/api/asset-categories?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load categories");
      }

      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load categories";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Category name is required");
      return;
    }

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
      const res = await fetch("/api/asset-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create category");
      }

      setName("");
      setDescription("");
      setSuccess("Category created");
      fetchCategories();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create category";
      setError(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
      const res = await fetch(`/api/asset-categories?id=${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete category");
      }

      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete category";
      setError(message);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
        Please log in to manage asset categories.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Asset Categories
            </h1>
            <p className="text-gray-600">
              Create and manage categories used when adding assets.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Electrical"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short note for this category"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Add Category
            </button>
            {success && (
              <span className="text-green-700 text-sm">{success}</span>
            )}
            {error && <span className="text-red-600 text-sm">{error}</span>}
          </div>
        </form>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Existing Categories
            </h2>
            <button
              onClick={fetchCategories}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-4 text-sm text-gray-600">
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">No categories yet.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {cat.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {cat.description || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {cat.created_at
                        ? new Date(cat.created_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
