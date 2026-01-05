"use client";

import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";
import { PowerIcon } from "@heroicons/react/24/outline";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Keep the shell visible while auth is loading to avoid layout collapse on refresh
  const showSidebar = loading || !!user;

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      {/* Sidebar */}
      {showSidebar && <Sidebar />}

      {/* Main content area */}
      <main className="flex-1 overflow-auto relative">
        {/* Top-right logout button */}
        {showSidebar && (
          <button
            onClick={handleLogout}
            className="fixed top-6 right-6 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors duration-200 shadow-lg hover:shadow-xl z-40"
            title="Logout"
          >
            <PowerIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>
        )}
        <div className="min-h-screen p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
