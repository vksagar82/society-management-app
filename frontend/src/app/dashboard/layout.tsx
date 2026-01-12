"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  return <>{children}</>;
}
