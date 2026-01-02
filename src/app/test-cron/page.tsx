"use client";

import { useState } from "react";

export default function TestCronPage() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const triggerCron = async (type: string) => {
    setLoading(true);
    setStatus(`Triggering ${type}...`);

    try {
      const response = await fetch(`/api/crons/${type}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${
            process.env.NEXT_PUBLIC_CRON_SECRET || "test-secret"
          }`,
        },
      });

      const data = await response.json();
      setStatus(`${type} completed: ${JSON.stringify(data)}`);
    } catch (error) {
      setStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Cron Jobs</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <button
              onClick={() => triggerCron("check-amc-expiry")}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? "Running..." : "Check AMC Expiry"}
            </button>

            <button
              onClick={() => triggerCron("check-asset-maintenance")}
              disabled={loading}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? "Running..." : "Check Asset Maintenance"}
            </button>
          </div>

          {status && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
                {status}
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> For production, set up Vercel Cron or a
            similar service to trigger these endpoints automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
