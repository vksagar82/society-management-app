"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ApiScopesManager from "@/app/api-scopes-manager/ApiScopesManager";

type TabType = "dashboard" | "users" | "scopes" | "audit" | "system";

export default function DeveloperDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const router = useRouter();

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "scopes", label: "API Scopes", icon: "🔐" },
    { id: "audit", label: "Audit Logs", icon: "📋" },
    { id: "system", label: "System", icon: "⚙️" },
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab />;
      case "users":
        return <UsersTab />;
      case "scopes":
        return <ApiScopesManager />;
      case "audit":
        return <AuditTab />;
      case "system":
        return <SystemTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
}

function DashboardTab() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Developer Dashboard
        </h1>
        <p className="text-gray-600">
          System-wide management, API scopes configuration, and developer tools
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm font-medium mb-2">
            Total Users
          </div>
          <div className="text-3xl font-bold text-gray-900">Loading...</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm font-medium mb-2">
            Active Societies
          </div>
          <div className="text-3xl font-bold text-gray-900">Loading...</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm font-medium mb-2">
            API Calls Today
          </div>
          <div className="text-3xl font-bold text-gray-900">Loading...</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm font-medium mb-2">
            System Health
          </div>
          <div className="text-3xl font-bold text-green-600">Healthy</div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Recent System Events
          </h2>
          <div className="space-y-3">
            <p className="text-gray-600 text-sm">No events to display</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            System Alerts
          </h2>
          <div className="space-y-3">
            <p className="text-gray-600 text-sm">No alerts</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          User Management
        </h1>
        <p className="text-gray-600">
          Manage system users, roles, and permissions
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                    Global Role
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-600"
                  >
                    Loading users...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuditTab() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Logs</h1>
        <p className="text-gray-600">
          View system activity, changes, and track all operations
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-600"
                  >
                    Loading audit logs...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemTab() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          System Settings
        </h1>
        <p className="text-gray-600">
          Configure system-wide settings and configurations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Database</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="text-green-600 font-medium">Connected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Backup</span>
              <span className="text-gray-900">Loading...</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Cache</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Size</span>
              <span className="text-gray-900">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
