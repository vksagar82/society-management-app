"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { useSelectedSociety } from "@/lib/auth/useSelectedSociety";
import { requireAdmin } from "@/lib/auth/permissions";
import { useRouter } from "next/navigation";

interface PendingUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  approval_status: string;
}

export default function PendingApprovalsPage() {
  const { user, loading: authLoading } = useAuth();
  const selectedSocietyId = useSelectedSociety();
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !requireAdmin(user)) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (requireAdmin(user) && selectedSocietyId) {
      fetchPendingUsers();
    }
  }, [user, selectedSocietyId]);

  const fetchPendingUsers = async () => {
    if (!selectedSocietyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/admin/pending-approvals?society_id=${selectedSocietyId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch pending users");
      const data = await response.json();
      setPendingUsers(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch pending users"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (
    userSocietyId: string,
    approve: boolean,
    rejectionReason?: string
  ) => {
    try {
      setProcessingId(userSocietyId);
      setError("");
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/admin/approve-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userSocietyId,
          approve,
          rejectionReason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to process approval");
      }

      // Refresh the list
      await fetchPendingUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process approval"
      );
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!requireAdmin(user)) {
    return null;
  }

  if (!selectedSocietyId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Pending Approvals
          </h1>
          <p className="mt-2 text-gray-600">
            Approve or reject user requests to join your society
          </p>
        </div>
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm font-medium text-yellow-800">
            Please select a society from the dropdown to view pending approvals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="mt-2 text-gray-600">
          Approve or reject user requests to join your society
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {pendingUsers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No pending approvals
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            All user requests have been processed.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Requested On
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {pendingUsers.map((pendingUser) => (
                <tr key={pendingUser.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {pendingUser.full_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {pendingUser.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {pendingUser.phone}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(pendingUser.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproval(pendingUser.id, true)}
                        disabled={processingId === pendingUser.id}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          handleApproval(
                            pendingUser.id,
                            false,
                            "Request rejected by admin"
                          )
                        }
                        disabled={processingId === pendingUser.id}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
