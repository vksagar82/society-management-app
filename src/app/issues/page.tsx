"use client";

import { useEffect, useState } from "react";
import { StatusBadge, PriorityBadge } from "@/components/Badge";
import { useAuth } from "@/lib/auth/context";

interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  location: string;
  reported_by_user?: { full_name: string };
  created_at: string;
}

export default function IssuesPage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchIssues = async () => {
    try {
      const params = new URLSearchParams();
      if (user?.society_id) params.append("society_id", user.society_id);
      if (filter) params.append("status", filter);

      const url = params.toString() ? `/api/issues?${params}` : "/api/issues";
      const res = await fetch(url);
      const data = await res.json();
      setIssues(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch issues:", error);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const payload: Record<string, unknown> = {
        title: formData.get("title"),
        description: formData.get("description"),
        category: formData.get("category"),
        priority: formData.get("priority"),
        location: formData.get("location"),
      };

      if (user?.society_id) payload.society_id = user.society_id;
      if (user?.id) payload.reported_by = user.id;

      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowForm(false);
        fetchIssues();
      }
    } catch (error) {
      console.error("Failed to create issue:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Issues & Complaints
            </h1>
            <p className="mt-2 text-gray-600">
              Report and track maintenance issues
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + Report Issue
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">Report New Issue</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option>Maintenance</option>
                    <option>Safety</option>
                    <option>Common Area</option>
                    <option>Amenities</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option>low</option>
                    <option>medium</option>
                    <option>high</option>
                    <option>urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  placeholder="e.g., Block A, Ground Floor"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
                >
                  Submit Issue
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
            onClick={() => setFilter("open")}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === "open"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border"
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter("in_progress")}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === "in_progress"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border"
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter("resolved")}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === "resolved"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border"
            }`}
          >
            Resolved
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12 text-gray-600">No issues found</div>
        ) : (
          <div className="space-y-4">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {issue.title}
                    </h3>
                    <p className="text-gray-600 mt-1">{issue.description}</p>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <StatusBadge status={issue.status} />
                    <PriorityBadge priority={issue.priority} />
                  </div>
                </div>
                <div className="flex gap-6 text-sm text-gray-600">
                  <div>📍 {issue.location || "Not specified"}</div>
                  <div>🏷️ {issue.category}</div>
                  <div>
                    👤 {issue.reported_by_user?.full_name || "Anonymous"}
                  </div>
                  <div>
                    📅 {new Date(issue.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
