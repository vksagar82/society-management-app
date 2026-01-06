"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelectedSociety } from "@/lib/auth/useSelectedSociety";

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  created_at: string;
  user?: { full_name?: string; email?: string };
}

export default function DeveloperSystemLogsPage() {
  const societyId = useSelectedSociety();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDateTime = useMemo(
    () => (value: string) => {
      if (!value) return "No activity yet";
      const date = new Date(value);
      return Number.isNaN(date.getTime())
        ? "Unavailable"
        : date.toLocaleString();
    },
    []
  );

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.append("limit", "50");
        params.append("offset", "0");
        if (societyId) params.append("society_id", societyId);

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("auth_token")
            : null;

        const res = await fetch(`/api/audit-logs?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Failed to load audit logs (${res.status})`);
        }

        const data = await res.json();
        setLogs(Array.isArray(data.logs) ? data.logs : []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading audit logs"
        );
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [societyId]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Logs</h1>
          <p className="text-[var(--muted)] text-sm mt-2">
            Latest audit events for the selected society.
          </p>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow p-6">
          {error && (
            <p className="text-[var(--chart-red)] text-sm mb-3">{error}</p>
          )}
          {loading ? (
            <p className="text-[var(--muted)] text-sm">Loading logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-[var(--muted)] text-sm">No audit logs found</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--panel)]"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                      {log.action}
                    </p>
                    <p className="text-xs text-[var(--muted)] truncate">
                      {log.user?.full_name || log.user?.email || "Unknown user"}
                    </p>
                    <p className="text-xs text-[var(--muted)] truncate">
                      {log.entity_type}
                      {log.entity_id ? ` (${log.entity_id})` : ""}
                    </p>
                  </div>
                  <span className="text-[var(--muted)] text-xs whitespace-nowrap ml-3">
                    {formatDateTime(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
