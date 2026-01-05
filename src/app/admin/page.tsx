"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { useSelectedSociety } from "@/lib/auth/useSelectedSociety";
import { useSelectedSocietyName } from "@/lib/auth/useSelectedSocietyName";

interface AdminStats {
  totalUsers: number;
  activeIssues: number;
  pendingApprovals: number;
  totalAssets: number;
}

const defaultStats: AdminStats = {
  totalUsers: 0,
  activeIssues: 0,
  pendingApprovals: 0,
  totalAssets: 0,
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const societyId = useSelectedSociety();
  const societyName = useSelectedSocietyName();
  const [stats, setStats] = useState<AdminStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cards = useMemo(
    () => [
      {
        label: "Total Users",
        value: stats.totalUsers,
        description: "Members in this society",
      },
      {
        label: "Active Issues",
        value: stats.activeIssues,
        description: "Open or in-progress issues",
      },
      {
        label: "Pending Approvals",
        value: stats.pendingApprovals,
        description: "Users awaiting approval",
      },
      {
        label: "Assets",
        value: stats.totalAssets,
        description: "Tracked assets in society",
      },
    ],
    [stats]
  );

  useEffect(() => {
    if (!societyId) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("auth_token");
        const authHeaders = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;
        const query = `society_id=${societyId}`;

        const [usersRes, issuesRes, approvalsRes, assetsRes] =
          await Promise.all([
            fetch(`/api/users?${query}`, { headers: authHeaders }),
            fetch(`/api/issues?${query}`, { headers: authHeaders }),
            fetch(`/api/admin/pending-approvals?${query}`, {
              headers: authHeaders,
            }),
            fetch(`/api/assets?${query}`),
          ]);

        if (!usersRes.ok) throw new Error("Failed to load users");
        if (!issuesRes.ok) throw new Error("Failed to load issues");
        if (!approvalsRes.ok) throw new Error("Failed to load approvals");
        if (!assetsRes.ok) throw new Error("Failed to load assets");

        const [users, issues, approvals, assets] = await Promise.all([
          usersRes.json(),
          issuesRes.json(),
          approvalsRes.json(),
          assetsRes.json(),
        ]);

        const activeIssues = issues.filter(
          (issue: { status?: string }) =>
            issue.status !== "resolved" && issue.status !== "closed"
        ).length;

        setStats({
          totalUsers: Array.isArray(users) ? users.length : 0,
          activeIssues,
          pendingApprovals: Array.isArray(approvals) ? approvals.length : 0,
          totalAssets: Array.isArray(assets) ? assets.length : 0,
        });
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
        setStats(defaultStats);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load admin dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [societyId]);

  if (!societyId && !loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-xl text-center">
          <h1 className="text-3xl font-bold text-white mb-3">
            Select a society to continue
          </h1>
          <p className="text-slate-300">
            Choose a society from the selector to view its admin dashboard
            metrics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Admin Dashboard{societyName ? ` - ${societyName}` : ""}
          </h1>
          <p className="text-slate-400">
            Manage your society, oversee system settings, and monitor operations
          </p>
        </div>

        {error && (
          <div className="mb-8 rounded-lg border border-red-500 bg-red-500/10 px-4 py-3 text-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div
              key={card.label}
              className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-colors"
            >
              <div className="text-slate-400 text-sm font-medium mb-2">
                {card.label}
              </div>
              <div className="text-3xl font-bold text-white">
                {loading ? "..." : card.value}
              </div>
              <div className="text-slate-500 text-xs mt-2">
                {card.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
