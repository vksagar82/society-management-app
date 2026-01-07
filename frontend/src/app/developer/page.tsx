"use client";

import { useEffect, useState } from "react";
import { useSelectedSociety } from "@/lib/auth/useSelectedSociety";

export default function DeveloperPage() {
  const societyId = useSelectedSociety();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSocieties: 0,
    apiCallsToday: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("auth_token")
            : null;
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        // Prepare date filter for today's API calls
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const apiRequestParams = new URLSearchParams();
        if (societyId) apiRequestParams.append("society_id", societyId);
        apiRequestParams.append("startDate", today.toISOString());
        apiRequestParams.append("endDate", tomorrow.toISOString());

        const [usersRes, societiesRes, apiRequestsRes] = await Promise.all([
          fetch(`/api/users${societyId ? `?society_id=${societyId}` : ""}`, {
            headers,
          }),
          fetch(`/api/societies`, { headers }),
          fetch(`/api/system/api-requests?${apiRequestParams.toString()}`, {
            headers,
          }),
        ]);

        if (!usersRes.ok) throw new Error("Failed to load users count");
        if (!societiesRes.ok) throw new Error("Failed to load societies");
        if (!apiRequestsRes.ok)
          throw new Error("Failed to load API request stats");

        const [usersData, societiesData, apiRequestsData] = await Promise.all([
          usersRes.json(),
          societiesRes.json(),
          apiRequestsRes.json(),
        ]);

        setStats({
          totalUsers: Array.isArray(usersData) ? usersData.length : 0,
          activeSocieties: Array.isArray(societiesData)
            ? societiesData.length
            : 0,
          apiCallsToday:
            typeof apiRequestsData?.count === "number"
              ? apiRequestsData.count
              : 0,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load developer metrics"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [societyId]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8" id="developer-dashboard">
          <h1 className="text-4xl font-bold mb-2">Developer Dashboard</h1>
          <p className="text-[var(--muted)]">
            System-wide management, API scopes configuration, and developer
            tools
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow p-6">
            <div className="text-[var(--muted)] text-sm font-medium mb-2">
              Total Users
            </div>
            <div className="text-3xl font-bold">
              {loading ? "Loading..." : stats.totalUsers}
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow p-6">
            <div className="text-[var(--muted)] text-sm font-medium mb-2">
              Active Societies
            </div>
            <div className="text-3xl font-bold">
              {loading ? "Loading..." : stats.activeSocieties}
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow p-6">
            <div className="text-[var(--muted)] text-sm font-medium mb-2">
              API Calls Today
            </div>
            <div className="text-3xl font-bold">
              {loading ? "Loading..." : stats.apiCallsToday}
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow p-6">
            <div className="text-[var(--muted)] text-sm font-medium mb-2">
              System Health
            </div>
            <div className="text-3xl font-bold text-[var(--chart-emerald)]">
              Healthy
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow p-6">
            <div className="text-[var(--muted)] text-sm font-medium mb-2">
              DB Status
            </div>
            <div className="text-lg font-semibold text-[var(--chart-emerald)]">
              Healthy
            </div>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow p-6">
            <div className="text-[var(--muted)] text-sm font-medium mb-2">
              Cache Status
            </div>
            <div className="text-lg font-semibold text-[var(--chart-blue)]">
              Active
            </div>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow p-6">
            <div className="text-[var(--muted)] text-sm font-medium mb-2">
              System Logs
            </div>
            <div className="text-lg font-semibold">View details</div>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow p-6">
            <div className="text-[var(--muted)] text-sm font-medium mb-2">
              API Scopes
            </div>
            <div className="text-lg font-semibold">Manage scopes</div>
          </div>
        </div>
      </div>
    </div>
  );
}
