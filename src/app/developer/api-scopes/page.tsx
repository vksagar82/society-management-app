"use client";

import ApiScopesManager from "@/app/api-scopes-manager/ApiScopesManager";

export default function DeveloperApiScopesPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">API Scopes</h1>
          <p className="text-[var(--muted)] text-sm mt-2">
            Manage scopes, permissions, and access policies for your services.
          </p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow p-6">
          <ApiScopesManager />
        </div>
      </div>
    </div>
  );
}
