"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SocietyApprovalStatus {
  society_id: string;
  society_name: string;
  approval_status: string;
  created_at: string;
}

export default function PendingApprovalPage() {
  const [societies, setSocieties] = useState<SocietyApprovalStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkApprovalStatus();
    // Poll every 30 seconds to check for approval updates
    const interval = setInterval(checkApprovalStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkApprovalStatus = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch("/api/auth/approval-status", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch approval status");
      }

      const data = await response.json();
      setSocieties(data.societies);

      // If at least one society is approved, redirect to dashboard
      const hasApproved = data.societies.some(
        (s: SocietyApprovalStatus) => s.approval_status === "approved"
      );

      if (hasApproved) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error checking approval status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const pendingSocieties = societies.filter(
    (s) => s.approval_status === "pending"
  );
  const rejectedSocieties = societies.filter(
    (s) => s.approval_status === "rejected"
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
              <svg
                className="h-8 w-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Pending Approval
            </h2>
            <p className="text-gray-600">
              Your registration is pending approval from society administrators
            </p>
          </div>

          {pendingSocieties.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Awaiting Approval
              </h3>
              <div className="space-y-3">
                {pendingSocieties.map((society) => (
                  <div
                    key={society.society_id}
                    className="border border-yellow-200 rounded-lg p-4 bg-yellow-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {society.society_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Requested on{" "}
                          {new Date(society.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rejectedSocieties.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Rejected
              </h3>
              <div className="space-y-3">
                {rejectedSocieties.map((society) => (
                  <div
                    key={society.society_id}
                    className="border border-red-200 rounded-lg p-4 bg-red-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {society.society_name}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        Rejected
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>What happens next?</strong>
            </p>
            <ul className="mt-2 text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Society admins will review your request</li>
              <li>You'll be notified once approved</li>
              <li>This page will automatically refresh when approved</li>
              <li>After approval, you can access your society dashboard</li>
            </ul>
          </div>

          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={checkApprovalStatus}
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Refresh Status
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
