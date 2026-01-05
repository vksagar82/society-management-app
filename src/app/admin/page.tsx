"use client";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-slate-400">
            Manage your society, oversee system settings, and monitor operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-colors">
            <div className="text-slate-400 text-sm font-medium mb-2">
              Total Users
            </div>
            <div className="text-3xl font-bold text-white">--</div>
          </div>

          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-colors">
            <div className="text-slate-400 text-sm font-medium mb-2">
              Active Issues
            </div>
            <div className="text-3xl font-bold text-white">--</div>
          </div>

          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-colors">
            <div className="text-slate-400 text-sm font-medium mb-2">
              Pending Approvals
            </div>
            <div className="text-3xl font-bold text-white">--</div>
          </div>

          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-colors">
            <div className="text-slate-400 text-sm font-medium mb-2">
              API Scopes
            </div>
            <div className="text-3xl font-bold text-white">--</div>
          </div>
        </div>
      </div>
    </div>
  );
}
