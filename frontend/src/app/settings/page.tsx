"use client";

import { useAuth } from "@/lib/auth/context";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useState, useEffect } from "react";
import { Save, Clock, Calendar, Globe, Bell, Lock, Eye } from "lucide-react";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [settings, setSettings] = useState({
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    language: "en",
    emailNotifications: true,
    pushNotifications: false,
    issueAlerts: true,
    amcReminders: true,
    theme: "auto",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/users/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings({ ...settings, ...data.settings });
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/users/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
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

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
            Settings
          </h1>
          <p className="text-[var(--muted)] mb-8">
            Manage your account preferences and settings
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500">
              {success}
            </div>
          )}

          <div className="space-y-6">
            {/* Regional Settings */}
            <div className="glass-panel p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">
                    Regional Settings
                  </h2>
                  <p className="text-sm text-[var(--muted)]">
                    Configure timezone and format preferences
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Timezone
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) =>
                      setSettings({ ...settings, timezone: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">
                      America/New York (EST)
                    </option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                    <option value="Australia/Sydney">
                      Australia/Sydney (AEDT)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date Format
                  </label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) =>
                      setSettings({ ...settings, dateFormat: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="DD-MMM-YYYY">DD-MMM-YYYY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Time Format
                  </label>
                  <select
                    value={settings.timeFormat}
                    onChange={(e) =>
                      setSettings({ ...settings, timeFormat: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                  >
                    <option value="12h">12-hour (AM/PM)</option>
                    <option value="24h">24-hour</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                    <Globe className="w-4 h-4 inline mr-2" />
                    Language
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) =>
                      setSettings({ ...settings, language: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="mr">मराठी (Marathi)</option>
                    <option value="gu">ગુજરાતી (Gujarati)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="glass-panel p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-[var(--accent-2)]/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[var(--accent-2)]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">
                    Notifications
                  </h2>
                  <p className="text-sm text-[var(--muted)]">
                    Choose how you want to be notified
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--hover-bg)] cursor-pointer hover:bg-[var(--active-bg)] transition-colors">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      Email Notifications
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      Receive notifications via email
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        emailNotifications: e.target.checked,
                      })
                    }
                    className="h-5 w-5 rounded accent-[var(--accent)]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--hover-bg)] cursor-pointer hover:bg-[var(--active-bg)] transition-colors">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      Push Notifications
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      Receive browser push notifications
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pushNotifications: e.target.checked,
                      })
                    }
                    className="h-5 w-5 rounded accent-[var(--accent)]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--hover-bg)] cursor-pointer hover:bg-[var(--active-bg)] transition-colors">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      Issue Alerts
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      Get notified about new issues and updates
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.issueAlerts}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        issueAlerts: e.target.checked,
                      })
                    }
                    className="h-5 w-5 rounded accent-[var(--accent)]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--hover-bg)] cursor-pointer hover:bg-[var(--active-bg)] transition-colors">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      AMC Reminders
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      Reminders for upcoming AMC renewals
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.amcReminders}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        amcReminders: e.target.checked,
                      })
                    }
                    className="h-5 w-5 rounded accent-[var(--accent)]"
                  />
                </label>
              </div>
            </div>

            {/* Appearance */}
            <div className="glass-panel p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">
                    Appearance
                  </h2>
                  <p className="text-sm text-[var(--muted)]">
                    Customize the look and feel
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                  Theme Preference
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) =>
                    setSettings({ ...settings, theme: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                >
                  <option value="auto">Auto (System)</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 font-medium shadow-lg"
              >
                <Save className="w-5 h-5" />
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
