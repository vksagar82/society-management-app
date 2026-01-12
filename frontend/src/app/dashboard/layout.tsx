"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  logout,
  getCurrentUser,
  restoreSession,
} from "@/store/slices/authSlice";
import { TopNav } from "@/components/TopNav";
import { ThemePalette } from "@/components/ThemePalette";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Users,
  Building2,
  FileText,
  Settings,
  LogOut,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Users", href: "/dashboard/users" },
  { icon: Building2, label: "Societies", href: "/dashboard/societies" },
  { icon: FileText, label: "Issues", href: "/dashboard/issues" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Restore session on mount
    dispatch(restoreSession());
  }, [dispatch]);

  useEffect(() => {
    // Check authentication
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
    if (!token && !isAuthenticated) {
      router.push("/auth/login");
    } else if (token && !user) {
      dispatch(getCurrentUser());
    }
  }, [isAuthenticated, user, router, dispatch]);

  useEffect(() => {
    // Check approval status and redirect if needed
    // Developers have global access - skip approval check
    if (user && user.global_role !== "developer" && user.user_societies) {
      const hasApprovedSociety = user.user_societies.some(
        (us: any) => us.approval_status === "approved"
      );

      // If user has no societies or all are pending/rejected, redirect to pending page
      if (user.user_societies.length === 0 || !hasApprovedSociety) {
        const currentPath = window.location.pathname;
        if (currentPath !== "/dashboard/pending-approval") {
          router.push("/dashboard/pending-approval");
        }
      }
    }
  }, [user, router]);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/auth/login");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-20 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "#0F0F0F", borderRight: "1px solid #1A1A1A" }}
      >
        <div className="flex flex-col h-full items-center py-6">
          {/* Logo */}
          <Link href="/dashboard" className="mb-8">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: "hsl(var(--primary))" }}
            >
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </Link>

          {/* Navigation Menu */}
          <nav className="flex-1 flex flex-col gap-2 w-full px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                typeof window !== "undefined" &&
                window.location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="relative group"
                  title={item.label}
                >
                  <div
                    className={`flex items-center justify-center h-12 w-12 rounded-xl transition-all ${
                      isActive ? "shadow-lg" : "hover:bg-white/5"
                    }`}
                    style={
                      isActive
                        ? {
                            backgroundColor: "hsl(var(--primary))",
                            boxShadow: "0 4px 12px hsl(var(--primary) / 0.3)",
                          }
                        : {}
                    }
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isActive
                          ? "text-white"
                          : "text-gray-400 group-hover:text-white"
                      }`}
                    />
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                      style={{ backgroundColor: "hsl(var(--primary))" }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Avatar */}
          <div className="mt-auto">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm shadow-lg"
              style={{ backgroundColor: "hsl(var(--primary))" }}
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white">
                  {user.full_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mt-4"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-gray-400" />
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-20 min-h-screen">
        {/* Top Navigation */}
        <TopNav
          user={{
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            avatar_url: user.avatar_url,
          }}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarOpen(true)}
          showMenuButton={true}
        />

        {/* Page Content */}
        <main
          className="min-h-[calc(100vh-4rem)]"
          style={{ backgroundColor: "#0A0A0A" }}
        >
          {children}
        </main>
      </div>

      {/* Theme Palette Selector */}
      <ThemePalette />
    </div>
  );
}
