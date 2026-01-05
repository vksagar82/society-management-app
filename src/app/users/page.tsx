"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { requireAdmin } from "@/lib/auth/permissions";
import { useSelectedSociety } from "@/lib/auth/useSelectedSociety";

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: "admin" | "manager" | "member";
  is_active: boolean;
  created_at: string;
}

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const selectedSocietyId = useSelectedSociety();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<"admin" | "manager" | "member">(
    "member"
  );
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !requireAdmin(user)) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (requireAdmin(user) && selectedSocietyId) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedSocietyId]);

  const fetchUsers = async () => {
    if (!selectedSocietyId) {
      setError("Please select a society first");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("auth_token");
      const url = `/api/users?society_id=${selectedSocietyId}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (targetUser: User) => {
    try {
      setError("");
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/auth/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: targetUser.id, newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update role");
      }

      setUsers(
        users.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );
      setSelectedUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
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
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">
            Manage user roles and permissions
          </p>
        </div>
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm font-medium text-yellow-800">
            Please select a society from the dropdown to view and manage users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">Manage user roles and permissions</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto shadow-md rounded-lg">
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
                Current Role
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {u.full_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{u.email}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{u.phone}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                      u.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : u.role === "manager"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                      u.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {u.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => {
                      setSelectedUser(u);
                      setNewRole(u.role);
                    }}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Change Role
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Change Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Change Role for {selectedUser.full_name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) =>
                    setNewRole(e.target.value as "admin" | "manager" | "member")
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  {newRole === "admin" &&
                    "Admin can manage users, AMCs, assets, issues, and alerts."}
                  {newRole === "manager" &&
                    "Manager can create and edit AMCs, assets, and issues but cannot delete them."}
                  {newRole === "member" &&
                    "Member can view content and report issues."}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRoleChange(selectedUser)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
                >
                  Update Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
