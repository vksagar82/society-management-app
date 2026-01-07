"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(
        `/auth/login?redirect=${
          typeof window !== "undefined"
            ? window.location.pathname
            : "/dashboard"
        }`
      );
    } else if (!loading && user) {
      // Check if user needs approval and redirect to pending page
      // Allow access to pending-approval, profile, and auth pages
      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : "";
      const allowedPaths = [
        "/auth/pending-approval",
        "/profile",
        "/auth/login",
        "/auth/signup",
      ];
      const isAllowedPath = allowedPaths.some((path) =>
        currentPath.startsWith(path)
      );

      // @ts-ignore - has_approved_society is added dynamically from API
      if (
        !isAllowedPath &&
        user.has_approved_society === false &&
        user.global_role !== "developer"
      ) {
        router.push("/auth/pending-approval");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
