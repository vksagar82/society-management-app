"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { createBrowserClient } from "@/lib/supabase/client";
import { useSelectedSociety } from "@/lib/auth/useSelectedSociety";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface AuditLog {
  id: string;
  society_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

export default function AuditLogsPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const societyId = useSelectedSociety();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Detail view
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize, entityType, action, societyId]);

  async function fetchLogs() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("limit", pageSize.toString());
      params.append("offset", ((page - 1) * pageSize).toString());

      if (societyId) params.append("society_id", societyId);

      if (entityType) params.append("entityType", entityType);
      if (action) params.append("action", action);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;

      const response = await fetch(`/api/audit-logs?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        if (response.status === 403) {
          router.push("/dashboard");
          return;
        }
        let errorMessage = `Failed to fetch logs: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (parseError) {
          const text = await response.text();
          errorMessage = `${errorMessage} - ${text || "Unknown error"}`;
        }
        setError(errorMessage);
        return;
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setTotalCount(data.count || 0);
      setError(null);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while loading audit logs"
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  function formatChanges(
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ) {
    if (!newValues) return "-";

    const changes = [];
    for (const [key, value] of Object.entries(newValues)) {
      if (oldValues && oldValues[key] !== value) {
        changes.push(`${key}: ${oldValues[key]} → ${value}`);
      } else if (!oldValues) {
        changes.push(`${key}: ${value}`);
      }
    }

    return changes.length > 0 ? changes.join(", ") : "-";
  }

  function getChangedFields(log: AuditLog) {
    const changes: Array<{ field: string; from: any; to: any }> = [];

    if (log.action === "CREATE" && log.new_values) {
      Object.entries(log.new_values).forEach(([key, value]) => {
        if (key !== "id" && key !== "created_at" && key !== "updated_at") {
          changes.push({ field: key, from: undefined, to: value });
        }
      });
    } else if (log.action === "DELETE" && log.old_values) {
      Object.entries(log.old_values).forEach(([key, value]) => {
        if (key !== "id" && key !== "created_at" && key !== "updated_at") {
          changes.push({ field: key, from: value, to: undefined });
        }
      });
    } else if (log.action === "UPDATE" && log.old_values && log.new_values) {
      Object.keys(log.new_values).forEach((key) => {
        if (
          JSON.stringify(log.old_values![key]) !==
          JSON.stringify(log.new_values![key])
        ) {
          changes.push({
            field: key,
            from: log.old_values![key],
            to: log.new_values![key],
          });
        }
      });
    }

    return changes;
  }

  function exportToCSV() {
    const headers = [
      "Timestamp",
      "User",
      "Email",
      "Action",
      "Entity Type",
      "Entity ID",
      "Changes",
      "IP Address",
    ];

    const rows = logs.map((log) => [
      formatDate(log.created_at),
      log.user?.full_name || "Unknown",
      log.user?.email || "",
      log.action,
      log.entity_type.toUpperCase(),
      log.entity_id?.slice(0, 8) || "",
      formatChanges(log.old_values, log.new_values),
      log.ip_address || "",
    ]);

    const csvContent = [
      headers,
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function exportToJSON() {
    const dataToExport = logs.map((log) => ({
      timestamp: log.created_at,
      user: {
        id: log.user_id,
        name: log.user?.full_name,
        email: log.user?.email,
      },
      action: log.action,
      entity: {
        type: log.entity_type,
        id: log.entity_id,
      },
      changes: {
        old: log.old_values,
        new: log.new_values,
      },
      metadata: {
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
      },
    }));

    const json = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <ProtectedLayout>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Audit Logs
            </h1>
            <p className="text-gray-600">
              Track all changes made by users in the system
            </p>
          </div>

          {/* Filter & Export Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <FunnelIcon className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-700">Filters</span>
                </button>

                <div className="text-sm text-gray-600 border-l border-gray-300 pl-3">
                  Total Records:{" "}
                  <span className="font-semibold">{totalCount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition border border-green-200"
                  title="Export to CSV"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">CSV</span>
                </button>
                <button
                  onClick={exportToJSON}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition border border-blue-200"
                  title="Export to JSON"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">JSON</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entity Type
                  </label>
                  <select
                    value={entityType}
                    onChange={(e) => {
                      setEntityType(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="issue">Issue</option>
                    <option value="asset">Asset</option>
                    <option value="amc">AMC</option>
                    <option value="user">User</option>
                    <option value="auth_login">Login</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action
                  </label>
                  <select
                    value={action}
                    onChange={(e) => {
                      setAction(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Actions</option>
                    <option value="CREATE">Create</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                    <option value="VIEW">View</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Size
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(parseInt(e.target.value));
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setEntityType("");
                      setAction("");
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition font-medium text-sm"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading audit logs...</p>
                </div>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No audit logs found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                          Entity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                          Changes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {logs.map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {formatDate(log.created_at)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="font-medium text-gray-900">
                              {log.user?.full_name || "Unknown User"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {log.user?.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                log.action === "CREATE"
                                  ? "bg-green-100 text-green-800"
                                  : log.action === "UPDATE"
                                  ? "bg-blue-100 text-blue-800"
                                  : log.action === "DELETE"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <div className="font-medium">
                              {log.entity_type.toUpperCase()}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {log.entity_id?.slice(0, 8)}...
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="max-w-xs truncate text-ellipsis">
                              {formatChanges(log.old_values, log.new_values)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                            {log.ip_address || "-"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedLog(log);
                                setShowDetail(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition text-sm"
                              title="View details"
                            >
                              <EyeIcon className="w-4 h-4" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {page} of {totalPages} ({totalCount} total records)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page >= totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Detail Modal */}
        {showDetail && selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
                <h2 className="text-lg font-bold">Audit Log Details</h2>
                <button
                  onClick={() => setShowDetail(false)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      Timestamp
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(selectedLog.created_at)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      Action
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                          selectedLog.action === "CREATE"
                            ? "bg-green-100 text-green-800"
                            : selectedLog.action === "UPDATE"
                            ? "bg-blue-100 text-blue-800"
                            : selectedLog.action === "DELETE"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {selectedLog.action}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      Entity Type
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedLog.entity_type.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      Entity ID
                    </label>
                    <p className="text-sm text-gray-600 mt-1 font-mono">
                      {selectedLog.entity_id}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      User
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedLog.user?.full_name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedLog.user?.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      IP Address
                    </label>
                    <p className="text-sm text-gray-600 mt-1 font-mono">
                      {selectedLog.ip_address || "-"}
                    </p>
                  </div>
                </div>

                {/* Changes */}
                {getChangedFields(selectedLog).length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-3">
                      Changes
                    </label>
                    <div className="space-y-3 bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                      {getChangedFields(selectedLog).map((change, idx) => (
                        <div
                          key={idx}
                          className="border-l-4 border-blue-500 pl-3"
                        >
                          <p className="text-sm font-semibold text-gray-900">
                            {change.field}
                          </p>
                          {change.from !== undefined && (
                            <p className="text-xs text-red-600 mt-1">
                              <span className="font-semibold">From:</span>{" "}
                              {JSON.stringify(change.from)}
                            </p>
                          )}
                          {change.to !== undefined && (
                            <p className="text-xs text-green-600">
                              <span className="font-semibold">To:</span>{" "}
                              {JSON.stringify(change.to)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* User Agent */}
                {selectedLog.user_agent && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      User Agent
                    </label>
                    <p className="text-xs text-gray-600 mt-1 break-words font-mono bg-gray-50 p-2 rounded">
                      {selectedLog.user_agent}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowDetail(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition font-medium text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedLayout>
  );
}
