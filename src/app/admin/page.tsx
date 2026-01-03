export default function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage users, oversee system-wide settings, and monitor society
          operations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Admin stat cards would go here */}
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
            Open Issues
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

      {/* Additional admin sections */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Recent Activities
          </h2>
          <div className="space-y-3">
            <p className="text-gray-600 text-sm">No activities to display</p>
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
