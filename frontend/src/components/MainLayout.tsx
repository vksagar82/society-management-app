"use client";

import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/lib/auth/context";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Keep the shell visible while auth is loading to avoid layout collapse on refresh
  const showSidebar = loading || !!user;

  return (
    <div className="flex min-h-screen bg-transparent">
      {showSidebar && <Sidebar />}

      <main className="flex-1 overflow-auto relative pt-20 pb-12 px-4 sm:px-6 md:px-8">
        {children}
      </main>
    </div>
  );
}
