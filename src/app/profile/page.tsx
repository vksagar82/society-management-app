"use client";

import { useAuth } from "@/lib/auth/context";
import { ProtectedLayout } from "@/components/ProtectedLayout";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {user?.full_name.charAt(0).toUpperCase()}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
            {user?.full_name}
          </h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <p className="mt-1 text-gray-900">{user?.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <p className="mt-1 text-gray-900">{user?.phone}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <p className="mt-1">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold capitalize ${
                    user?.role === "admin"
                      ? "bg-purple-100 text-purple-800"
                      : user?.role === "manager"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {user?.role}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <p className="mt-1">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    user?.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user?.is_active ? "Active" : "Inactive"}
                </span>
              </p>
            </div>

            {user?.flat_no && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Flat No.
                </label>
                <p className="mt-1 text-gray-900">{user.flat_no}</p>
              </div>
            )}

            {user?.wing && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Wing
                </label>
                <p className="mt-1 text-gray-900">{user.wing}</p>
              </div>
            )}
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Role Description:</p>
            {user?.role === "admin" && (
              <p className="mt-2">
                You have full administrative access to manage all aspects of the
                society.
              </p>
            )}
            {user?.role === "manager" && (
              <p className="mt-2">
                You can create and manage AMCs, assets, and issues but cannot
                delete them.
              </p>
            )}
            {user?.role === "member" && (
              <p className="mt-2">
                You can view society information and report issues.
              </p>
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
