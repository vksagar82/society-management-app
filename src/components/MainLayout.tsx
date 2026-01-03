"use client";

import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/lib/auth/context";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Only show sidebar for authenticated users
  const showSidebar = !loading && user;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      {/* Sidebar */}
      {showSidebar && <Sidebar />}

      {/* Main content area */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-screen p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
