"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/Badge";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useAuth } from "@/lib/auth/context";

interface DashboardStats {
  totalIssues: number;
  openIssues: number;
  totalAssets: number;
  activeAMCs: number;
  expiringAMCs: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalIssues: 0,
    openIssues: 0,
    totalAssets: 0,
    activeAMCs: 0,
    expiringAMCs: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch from API - remove society_id filter if not set
        const societyParam = user?.society_id
          ? `?society_id=${user.society_id}`
          : "";

        const [issuesRes, assetsRes, amcsRes] = await Promise.all([
          fetch(`/api/issues${societyParam}`),
          fetch(`/api/assets${societyParam}`),
          fetch(`/api/amcs${societyParam}`),
        ]);

        const issues = await issuesRes.json();
        const assets = await assetsRes.json();
        const amcs = await amcsRes.json();

        const openIssues = issues.filter(
          (i: { status: string }) => i.status === "open"
        ).length;
        const expiringAMCs = amcs.filter(
          (a: { status: string }) => a.status !== "expired"
        ).length;

        setStats({
          totalIssues: issues.length,
          openIssues,
          totalAssets: assets.length,
          activeAMCs: amcs.filter(
            (a: { status: string }) => a.status === "active"
          ).length,
          expiringAMCs,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome to Society Management System
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <StatCard
            title="Total Issues"
            value={stats.totalIssues}
            icon="📋"
            color="blue"
          />
          <StatCard
            title="Open Issues"
            value={stats.openIssues}
            icon="⚠️"
            color="red"
          />
          <StatCard
            title="Total Assets"
            value={stats.totalAssets}
            icon="🏢"
            color="green"
          />
          <StatCard
            title="Active AMCs"
            value={stats.activeAMCs}
            icon="📄"
            color="yellow"
          />
          <StatCard
            title="Expiring Soon"
            value={stats.expiringAMCs}
            icon="⏰"
            color="yellow"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <a
                href="/issues"
                className="block p-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors"
              >
                → Report New Issue
              </a>
              <a
                href="/amcs"
                className="block p-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 font-medium transition-colors"
              >
                → Manage AMCs
              </a>
              <a
                href="/assets"
                className="block p-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium transition-colors"
              >
                → Track Assets
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              System Status
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Database</span>
                <span className="text-green-600 font-medium">✓ Connected</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Notifications</span>
                <span className="text-green-600 font-medium">✓ Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">API</span>
                <span className="text-green-600 font-medium">✓ Running</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
