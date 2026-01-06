"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelectedSociety } from "@/lib/auth/useSelectedSociety";

export default function DeveloperDatabaseStatusPage() {
  const societyId = useSelectedSociety();
  const [status, setStatus] = useState({ dbStatus: "unknown", lastBackup: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDateTime = useMemo(
    () => (value: string) => {
      if (!value) return "No backup recorded";
      const date = new Date(value);
      return Number.isNaN(date.getTime())
        ? "Unavailable"
        : date.toLocaleString();
    },
    []
  );

  useEffect(() => {
    const loadStatus = async () => {
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

        const params = new URLSearchParams();
        if (societyId) params.append("society_id", societyId);

        const res = await fetch(`/api/system/status?${params.toString()}`, {
          headers,
        });

        if (!res.ok) {
          throw new Error("Failed to load system status");
        }

        const data = await res.json();
        setStatus({
          dbStatus: data.dbStatus || "unknown",
          lastBackup: data.lastBackup || "",
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load system status"
        );
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, [societyId]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Database Status</h1>
          <p className="text-[var(--muted)] text-sm mt-2">
            Connectivity and backup information for the selected society.
          </p>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow p-6 space-y-4">
          {error && <p className="text-[var(--chart-red)] text-sm">{error}</p>}
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Status</span>
            <span
              className="font-semibold"
              style={{ color: "var(--chart-emerald)" }}
            >
              {loading ? "Loading..." : status.dbStatus || "Unknown"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Last Backup</span>
            <span className="text-[var(--foreground)]">
              {loading ? "Loading..." : formatDateTime(status.lastBackup)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
