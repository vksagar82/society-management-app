"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { isAdmin } from "@/lib/auth/permissions";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin(user))) {
      router.push(
        `/auth/login?redirect=${
          typeof window !== "undefined"
            ? window.location.pathname
            : "/dashboard"
        }`
      );
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !isAdmin(user)) {
    return null;
  }

  return <>{children}</>;
}
