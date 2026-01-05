"use client";

import ApiScopesManager from "@/app/api-scopes-manager/ApiScopesManager";

export default function ApiScopesPage() {
  return (
    <div className="min-h-screen bg-slate-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">API Scopes</h1>
          <p className="text-slate-400">
            Manage API scopes and permissions for your application
          </p>
        </div>
        <ApiScopesManager />
      </div>
    </div>
  );
}
