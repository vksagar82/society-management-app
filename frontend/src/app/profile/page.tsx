"use client";

import { useAuth } from "@/lib/auth/context";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useState } from "react";
import { Save, X, Edit2 } from "lucide-react";

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
  });

  const handleEdit = () => {
    setFormData({
      full_name: user?.full_name || "",
      phone: user?.phone || "",
    });
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      await refreshUser();
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[var(--foreground)]">Loading...</p>
      </div>
    );
  }

  const userRole = user?.global_role || user?.role || "member";

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto glass-panel p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              My Profile
            </h1>
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500">
              {success}
            </div>
          )}

          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--accent-2)] to-[var(--accent)] flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {user?.full_name?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                />
              ) : (
                <p className="text-lg text-[var(--foreground)]">
                  {user?.full_name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                Email
              </label>
              <p className="text-lg text-[var(--foreground)]">{user?.email}</p>
              <p className="text-xs text-[var(--muted)] mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                Phone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                />
              ) : (
                <p className="text-lg text-[var(--foreground)]">
                  {user?.phone || "Not provided"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                Role
              </label>
              <span className="inline-flex rounded-full px-4 py-2 text-sm font-semibold capitalize bg-[var(--accent)] text-white border border-[var(--accent)]">
                {userRole}
              </span>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                Status
              </label>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                  user?.is_active
                    ? "bg-green-500/20 text-green-500 border border-green-500/30"
                    : "bg-red-500/20 text-red-500 border border-red-500/30"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    user?.is_active ? "bg-green-500" : "bg-red-500"
                  } animate-pulse`}
                />
                {user?.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            {(user?.flat_no || user?.wing) && (
              <div className="grid grid-cols-2 gap-4">
                {user?.flat_no && (
                  <div>
                    <label className="block text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                      Flat No.
                    </label>
                    <p className="text-lg text-[var(--foreground)]">
                      {user.flat_no}
                    </p>
                  </div>
                )}
                {user?.wing && (
                  <div>
                    <label className="block text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                      Wing
                    </label>
                    <p className="text-lg text-[var(--foreground)]">
                      {user.wing}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}

          <div className="mt-8 p-4 rounded-xl bg-[var(--hover-bg)] border border-[var(--border)]">
            <p className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
              Role Description
            </p>
            <p className="text-sm text-[var(--foreground)] leading-relaxed">
              {userRole === "developer" &&
                "Full system access with developer tools and all administrative privileges."}
              {userRole === "admin" &&
                "Full administrative access to manage all aspects of the society."}
              {userRole === "manager" &&
                "Can create and manage AMCs, assets, and issues but cannot delete them."}
              {userRole === "member" &&
                "Can view society information and report issues."}
            </p>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
