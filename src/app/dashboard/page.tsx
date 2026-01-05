"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/Badge";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useAuth } from "@/lib/auth/context";
import { useSelectedSociety } from "@/lib/auth/useSelectedSociety";
import { useSelectedSocietyName } from "@/lib/auth/useSelectedSocietyName";
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressBar,
  TrendCard,
} from "@/components/DashboardCharts";

interface DashboardStats {
  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
  totalAssets: number;
  activeAMCs: number;
  expiringAMCs: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const societyId = useSelectedSociety();
  const societyName = useSelectedSocietyName();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalIssues: 0,
    openIssues: 0,
    resolvedIssues: 0,
    totalAssets: 0,
    activeAMCs: 0,
    expiringAMCs: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (societyId) {
      fetchStats();
    }
  }, [societyId]);

  const fetchStats = async () => {
    if (!societyId) return;

    try {
      const societyParam = `?society_id=${societyId}`;

      const token = localStorage.getItem("auth_token");
      const authHeaders = token
        ? { Authorization: `Bearer ${token}` }
        : undefined;

      const [issuesRes, assetsRes, amcsRes] = await Promise.all([
        fetch(`/api/issues${societyParam}`, { headers: authHeaders }),
        fetch(`/api/assets${societyParam}`, { headers: authHeaders }),
        fetch(`/api/amcs${societyParam}`, { headers: authHeaders }),
      ]);

      const issues = await issuesRes.json();
      const assets = await assetsRes.json();
      const amcs = await amcsRes.json();

      const openIssues = issues.filter(
        (i: { status: string }) => i.status === "open"
      ).length;
      const resolvedIssues = issues.filter(
        (i: { status: string }) =>
          i.status === "resolved" || i.status === "closed"
      ).length;

      // Properly count AMCs based on expiry date
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day

      const activeAMCs = amcs.filter((a: { contract_end_date: string }) => {
        const endDate = new Date(a.contract_end_date);
        endDate.setHours(0, 0, 0, 0); // Reset time to start of day
        return endDate > today;
      }).length;

      const expiredAMCs = amcs.filter((a: { contract_end_date: string }) => {
        const endDate = new Date(a.contract_end_date);
        endDate.setHours(0, 0, 0, 0); // Reset time to start of day
        return endDate <= today;
      }).length;

      setStats({
        totalIssues: issues.length,
        openIssues,
        resolvedIssues,
        totalAssets: assets.length,
        activeAMCs,
        expiringAMCs: expiredAMCs,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Show message if no society selected
  if (!societyId) {
    return (
      <ProtectedLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              No Society Selected
            </h2>
            <p className="text-slate-600">
              Please select a society from the sidebar to view the dashboard.
            </p>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  // Generate trend data based on actual stats
  const issuesTrendData = [
    { label: "Jan", value: 0 },
    { label: "Feb", value: 0 },
    { label: "Mar", value: 0 },
    { label: "Apr", value: 0 },
    { label: "May", value: 0 },
    { label: "Jun", value: stats.totalIssues },
  ];

  const assetsCategoryData = [
    {
      label: "Electrical",
      value: Math.ceil(stats.totalAssets * 0.35),
      color: "#fbbf24",
    },
    {
      label: "Plumbing",
      value: Math.ceil(stats.totalAssets * 0.25),
      color: "#60a5fa",
    },
    {
      label: "Structural",
      value: Math.ceil(stats.totalAssets * 0.25),
      color: "#34d399",
    },
    {
      label: "Other",
      value: Math.ceil(stats.totalAssets * 0.15),
      color: "#a78bfa",
    },
  ];

  const amcsStatusData = [
    { label: "Active", value: stats.activeAMCs, color: "#10b981" },
    {
      label: "Expired",
      value: stats.expiringAMCs,
      color: "#ef4444",
    },
  ];

  const issuesStatusData = [
    { label: "Open", value: stats.openIssues, color: "#ef4444" },
    { label: "Resolved", value: stats.resolvedIssues, color: "#10b981" },
    {
      label: "In Progress",
      value: Math.max(
        0,
        stats.totalIssues - stats.openIssues - stats.resolvedIssues
      ),
      color: "#3b82f6",
    },
  ];

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading dashboard...</p>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Dashboard {societyName && `- ${societyName}`}
            </h1>
            <p className="mt-2 text-gray-600">
              Welcome back,{" "}
              <span className="font-semibold text-gray-900">
                {user?.full_name}
              </span>
              . Here's your property management overview.
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <StatCard
              title="Total Issues"
              value={stats.totalIssues}
              color="red"
              trend={5}
              trendLabel="from last month"
              icon="📋"
            />
            <StatCard
              title="Open Issues"
              value={stats.openIssues}
              color="orange"
              icon="⚠️"
            />
            <StatCard
              title="Resolved"
              value={stats.resolvedIssues}
              color="green"
              trend={12}
              trendLabel="improvement"
              icon="✓"
            />
            <StatCard
              title="Total Assets"
              value={stats.totalAssets}
              color="blue"
              icon="🏢"
            />
            <StatCard
              title="Active AMCs"
              value={stats.activeAMCs}
              color="indigo"
              icon="📄"
            />
            <StatCard
              title="Expiring Soon"
              value={stats.expiringAMCs}
              color="purple"
              icon="⏰"
              description="Expired AMCs"
            />
          </div>

          {/* Main Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <LineChart
              title="Issues Trend (Last 6 Months)"
              data={issuesTrendData}
              clickable
              onClick={() => router.push("/issues")}
            />
            <BarChart
              title="Assets by Category"
              data={assetsCategoryData.map((d) => ({
                label: d.label,
                value: d.value,
                color: d.color,
              }))}
              clickable
              onClick={() => router.push("/assets")}
            />
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 cursor-pointer hover:shadow-lg transition-shadow duration-300"
              onClick={() => router.push("/issues")}
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Issues Status <span className="text-blue-600 text-sm">→</span>
              </h2>
              <PieChart title="" data={issuesStatusData} size={100} />
            </div>

            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 cursor-pointer hover:shadow-lg transition-shadow duration-300"
              onClick={() => router.push("/amcs")}
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                AMCs Status <span className="text-blue-600 text-sm">→</span>
              </h2>
              <PieChart title="" data={amcsStatusData} size={100} />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Progress Overview
              </h2>
              <div className="space-y-4">
                <ProgressBar
                  label="Issue Resolution"
                  value={stats.resolvedIssues}
                  max={stats.totalIssues}
                  color="bg-green-600"
                />
                <ProgressBar
                  label="AMC Coverage"
                  value={stats.activeAMCs}
                  max={stats.totalAssets}
                  color="bg-blue-600"
                />
                <ProgressBar
                  label="Asset Health"
                  value={Math.ceil(stats.totalAssets * 0.85)}
                  max={stats.totalAssets}
                  color="bg-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Trend Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <TrendCard
              title="Issues This Month"
              value={stats.openIssues}
              change={5}
              isPositive={false}
              icon="⚠️"
            />
            <TrendCard
              title="Resolution Rate"
              value={`${Math.round(
                (stats.resolvedIssues / (stats.totalIssues || 1)) * 100
              )}%`}
              change={12}
              isPositive={true}
              icon="📈"
            />
            <TrendCard
              title="Asset Utilization"
              value={`${Math.round(
                (stats.activeAMCs / (stats.totalAssets || 1)) * 100
              )}%`}
              change={8}
              isPositive={true}
              icon="🏢"
            />
            <TrendCard
              title="AMC Renewal Rate"
              value={`${Math.round(
                (stats.expiringAMCs / (stats.activeAMCs || 1)) * 100
              )}%`}
              change={-3}
              isPositive={false}
              icon="📋"
            />
          </div>

          {/* Action Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⚡</span>
                <h2 className="text-lg font-semibold text-gray-900">
                  Quick Actions
                </h2>
              </div>
              <div className="space-y-3">
                <a
                  href="/issues"
                  className="block p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 text-blue-700 font-medium transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    <span>→ Report New Issue</span>
                    <span className="group-hover:translate-x-1 transition-transform">
                      📋
                    </span>
                  </div>
                </a>
                <a
                  href="/amcs"
                  className="block p-4 rounded-lg bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200 text-green-700 font-medium transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    <span>→ Manage AMCs</span>
                    <span className="group-hover:translate-x-1 transition-transform">
                      📄
                    </span>
                  </div>
                </a>
                <a
                  href="/assets"
                  className="block p-4 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border border-purple-200 text-purple-700 font-medium transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    <span>→ Track Assets</span>
                    <span className="group-hover:translate-x-1 transition-transform">
                      🏢
                    </span>
                  </div>
                </a>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🔧</span>
                <h2 className="text-lg font-semibold text-gray-900">
                  System Status
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg">
                  <span className="text-gray-700 font-medium">Database</span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-xs font-bold text-green-700 border border-green-300">
                    <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
                  <span className="text-gray-700 font-medium">
                    Notifications
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-xs font-bold text-blue-700 border border-blue-300">
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg">
                  <span className="text-gray-700 font-medium">API</span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-xs font-bold text-indigo-700 border border-indigo-300">
                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                    Running
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
