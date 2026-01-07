"use client";

import { useEffect, useState } from "react";
import { useSelectedSociety } from "@/lib/auth/useSelectedSociety";

export default function DeveloperCacheStatusPage() {
  const societyId = useSelectedSociety();
  const [status, setStatus] = useState({
    cacheStatus: "unknown",
    cacheEntries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          cacheStatus: data.cacheStatus || "unknown",
          cacheEntries:
            typeof data.cacheEntries === "number" ? data.cacheEntries : 0,
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
          <h1 className="text-3xl font-bold">Cache Status</h1>
          <p className="text-[var(--muted)] text-sm mt-2">
            Cache connectivity and usage metrics for the selected society.
          </p>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow p-6 space-y-4">
          {error && <p className="text-[var(--chart-red)] text-sm">{error}</p>}
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Status</span>
            <span
              className="font-semibold"
              style={{ color: "var(--chart-blue)" }}
            >
              {loading ? "Loading..." : status.cacheStatus || "Unknown"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Cache Entries</span>
            <span className="text-[var(--foreground)]">
              {loading ? "Loading..." : `${status.cacheEntries} entries`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
