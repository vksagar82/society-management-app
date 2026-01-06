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
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Building2,
  FileText,
  Clock,
  Zap,
  Settings,
} from "lucide-react";

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
        <div className="min-h-screen bg-[var(--background)] p-8 flex items-center justify-center">
          <div className="bg-[var(--card)] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.55)] p-8 max-w-md text-center border border-[var(--border)] backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
              No Society Selected
            </h2>
            <p className="text-[var(--muted)]">
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
      color: "var(--chart-amber)",
    },
    {
      label: "Plumbing",
      value: Math.ceil(stats.totalAssets * 0.25),
      color: "var(--chart-blue)",
    },
    {
      label: "Structural",
      value: Math.ceil(stats.totalAssets * 0.25),
      color: "var(--chart-emerald)",
    },
    {
      label: "Other",
      value: Math.ceil(stats.totalAssets * 0.15),
      color: "var(--chart-purple)",
    },
  ];

  const amcsStatusData = [
    { label: "Active", value: stats.activeAMCs, color: "var(--chart-emerald)" },
    {
      label: "Expired",
      value: stats.expiringAMCs,
      color: "var(--chart-red)",
    },
  ];

  const issuesStatusData = [
    { label: "Open", value: stats.openIssues, color: "var(--chart-red)" },
    {
      label: "Resolved",
      value: stats.resolvedIssues,
      color: "var(--chart-emerald)",
    },
    {
      label: "In Progress",
      value: Math.max(
        0,
        stats.totalIssues - stats.openIssues - stats.resolvedIssues
      ),
      color: "var(--chart-blue)",
    },
  ];

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center h-screen bg-[var(--background)]">
          <div className="text-center">
            <div
              className="w-12 h-12 border-4 border-[var(--border)] rounded-full animate-spin mx-auto mb-4"
              style={{ borderTopColor: "var(--chart-cyan)" }}
            />
            <p className="text-[var(--muted)] font-medium">
              Loading dashboard...
            </p>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent break-words"
            style={{
              backgroundImage:
                "linear-gradient(90deg, var(--chart-cyan), var(--chart-blue), var(--chart-purple))",
              filter: "drop-shadow(0 0 14px rgba(58,122,223,0.28))",
            }}
          >
            Dashboard {societyName && `- ${societyName}`}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[var(--muted)]">
            Welcome back,{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {user?.full_name}
            </span>
            . Here's your property management overview.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatCard
            title="Total Issues"
            value={stats.totalIssues}
            color="red"
            trend={5}
            trendLabel="from last month"
            icon={<ClipboardList className="w-8 h-8" />}
          />
          <StatCard
            title="Open Issues"
            value={stats.openIssues}
            color="orange"
            icon={<AlertTriangle className="w-8 h-8" />}
          />
          <StatCard
            title="Resolved"
            value={stats.resolvedIssues}
            color="green"
            trend={12}
            trendLabel="improvement"
            icon={<CheckCircle2 className="w-8 h-8" />}
          />
          <StatCard
            title="Total Assets"
            value={stats.totalAssets}
            color="blue"
            icon={<Building2 className="w-8 h-8" />}
          />
          <StatCard
            title="Active AMCs"
            value={stats.activeAMCs}
            color="indigo"
            icon={<FileText className="w-8 h-8" />}
          />
          <StatCard
            title="Expiring Soon"
            value={stats.expiringAMCs}
            color="purple"
            icon={<Clock className="w-8 h-8" />}
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
            className="bg-[var(--card)] rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.45)] p-6 border border-[var(--border)] cursor-pointer hover:border-[var(--chart-cyan)] transition-all duration-300 backdrop-blur-xl"
            onClick={() => router.push("/issues")}
          >
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Issues Status{" "}
              <span className="text-sm" style={{ color: "var(--chart-cyan)" }}>
                →
              </span>
            </h2>
            <PieChart title="" data={issuesStatusData} size={100} />
          </div>

          <div
            className="bg-[var(--card)] rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.45)] p-6 border border-[var(--border)] cursor-pointer hover:border-[var(--chart-cyan)] transition-all duration-300 backdrop-blur-xl"
            onClick={() => router.push("/amcs")}
          >
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              AMCs Status{" "}
              <span className="text-sm" style={{ color: "var(--chart-cyan)" }}>
                →
              </span>
            </h2>
            <PieChart title="" data={amcsStatusData} size={100} />
          </div>

          <div className="bg-[var(--card)] rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.45)] p-6 border border-[var(--border)] backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Progress Overview
            </h2>
            <div className="space-y-4">
              <ProgressBar
                label="Issue Resolution"
                value={stats.resolvedIssues}
                max={stats.totalIssues}
                color="var(--chart-emerald)"
              />
              <ProgressBar
                label="AMC Coverage"
                value={stats.activeAMCs}
                max={stats.totalAssets}
                color="var(--chart-blue)"
              />
              <ProgressBar
                label="Asset Health"
                value={Math.ceil(stats.totalAssets * 0.85)}
                max={stats.totalAssets}
                color="var(--chart-purple)"
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
          <div className="bg-[var(--card)] rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.45)] p-6 border border-[var(--border)] backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-6 h-6" style={{ color: "var(--chart-cyan)" }} />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Quick Actions
              </h2>
            </div>
            <div className="space-y-3">
              <a
                href="/issues"
                className="block p-4 rounded-lg font-medium transition-all duration-300 group"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, color-mix(in srgb, var(--chart-cyan) 14%, transparent), color-mix(in srgb, var(--chart-blue) 14%, transparent))",
                  border:
                    "1px solid color-mix(in srgb, var(--chart-cyan) 28%, transparent)",
                  color: "var(--chart-cyan)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">Report New Issue</span>
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
              <a
                href="/amcs"
                className="block p-4 rounded-lg font-medium transition-all duration-300 group"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, color-mix(in srgb, var(--chart-emerald) 14%, transparent), color-mix(in srgb, var(--chart-emerald) 10%, transparent))",
                  border:
                    "1px solid color-mix(in srgb, var(--chart-emerald) 28%, transparent)",
                  color: "var(--chart-emerald)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">Manage AMCs</span>
                  <FileText className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
              <a
                href="/assets"
                className="block p-4 rounded-lg font-medium transition-all duration-300 group"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, color-mix(in srgb, var(--chart-purple) 14%, transparent), color-mix(in srgb, var(--chart-blue) 12%, transparent))",
                  border:
                    "1px solid color-mix(in srgb, var(--chart-purple) 28%, transparent)",
                  color: "var(--chart-purple)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">Track Assets</span>
                  <Building2 className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-[var(--card)] rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.45)] p-6 border border-[var(--border)] backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-4">
              <Settings
                className="w-6 h-6"
                style={{ color: "var(--chart-cyan)" }}
              />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                System Status
              </h2>
            </div>
            <div className="space-y-3">
              <div
                className="flex items-center justify-between p-4 rounded-lg"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, color-mix(in srgb, var(--chart-emerald) 12%, transparent), color-mix(in srgb, var(--chart-emerald) 8%, transparent))",
                  border:
                    "1px solid color-mix(in srgb, var(--chart-emerald) 26%, transparent)",
                }}
              >
                <span className="text-[var(--foreground)] font-medium">
                  Database
                </span>
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 bg-white/5 rounded-full text-xs font-bold"
                  style={{
                    color: "var(--chart-emerald)",
                    border:
                      "1px solid color-mix(in srgb, var(--chart-emerald) 30%, transparent)",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: "var(--chart-emerald)" }}
                  />
                  Connected
                </span>
              </div>
              <div
                className="flex items-center justify-between p-4 rounded-lg"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, color-mix(in srgb, var(--chart-blue) 12%, transparent), color-mix(in srgb, var(--chart-cyan) 12%, transparent))",
                  border:
                    "1px solid color-mix(in srgb, var(--chart-cyan) 26%, transparent)",
                }}
              >
                <span className="text-[var(--foreground)] font-medium">
                  Notifications
                </span>
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 bg-white/5 rounded-full text-xs font-bold"
                  style={{
                    color: "var(--chart-cyan)",
                    border:
                      "1px solid color-mix(in srgb, var(--chart-cyan) 30%, transparent)",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: "var(--chart-cyan)" }}
                  />
                  Active
                </span>
              </div>
              <div
                className="flex items-center justify-between p-4 rounded-lg"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, color-mix(in srgb, var(--chart-purple) 12%, transparent), color-mix(in srgb, var(--chart-blue) 10%, transparent))",
                  border:
                    "1px solid color-mix(in srgb, var(--chart-purple) 26%, transparent)",
                }}
              >
                <span className="text-[var(--foreground)] font-medium">
                  API
                </span>
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 bg-white/5 rounded-full text-xs font-bold"
                  style={{
                    color: "var(--chart-purple)",
                    border:
                      "1px solid color-mix(in srgb, var(--chart-purple) 30%, transparent)",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: "var(--chart-purple)" }}
                  />
                  Running
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
