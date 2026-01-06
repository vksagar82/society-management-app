"use client";

import { useAuth } from "@/lib/auth/context";
import { useTheme } from "@/lib/theme/context";
import { useRouter } from "next/navigation";
import { LogOut, User, Settings, ChevronDown, Sun, Moon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const roleColorMap: Record<string, string> = {
  developer: "var(--accent-2)",
  admin: "var(--accent-2)",
  manager: "var(--accent)",
  member: "var(--muted)",
};

function badgeStyles(color: string) {
  return {
    backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
    color,
    borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
  } as const;
}

export function NavBar() {
  const { logout, user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | Event) => {
      if (
        isProfileOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside, true);
    document.addEventListener("touchstart", handleClickOutside, true);

    return () => {
      document.removeEventListener("click", handleClickOutside, true);
      document.removeEventListener("touchstart", handleClickOutside, true);
    };
  }, [isProfileOpen]);

  if (!user || loading) {
    return null;
  }

  const userRole = (user?.global_role ?? user?.role ?? "member") as string;
  const roleColor =
    roleColorMap[userRole.toLowerCase() as keyof typeof roleColorMap] ||
    "var(--muted)";

  return (
    <div className="sticky top-0 left-0 right-0 z-50 bg-[var(--navbar-bg)] border-b border-[var(--border)] shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex items-center gap-4 px-4 sm:px-6 lg:px-10 py-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent-2)] via-[var(--accent)] to-[var(--accent)] text-[var(--background)] font-semibold shadow-lg">
            SM
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Society Management
            </p>
            <p className="text-xs text-[var(--muted)]">Control center</p>
          </div>
        </div>

        <div className="hidden md:flex flex-1 items-center">
          <div className="relative w-full max-w-lg">
            <input
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] shadow-inner focus:border-[var(--accent-2)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
              placeholder="Search (users, issues, assets)"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">
              ⌘K
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto text-[var(--foreground)]">
          <button
            onClick={toggleTheme}
            className="h-10 w-10 rounded-full border border-[var(--border)] bg-[var(--panel)] shadow flex items-center justify-center transition-colors hover:border-[var(--accent-2)]/60 hover:text-[var(--accent-2)]"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
          <button className="h-10 w-10 rounded-full border border-[var(--border)] bg-[var(--panel)] shadow transition-colors hover:border-[var(--accent-2)]/60 hover:text-[var(--accent-2)]">
            🔔
          </button>
          <button className="h-10 w-10 rounded-full border border-[var(--border)] bg-[var(--panel)] shadow transition-colors hover:border-[var(--accent-2)]/60 hover:text-[var(--accent-2)]">
            <Settings className="w-4 h-4" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 pl-2 transition-opacity hover:opacity-80"
            >
              <span className="hidden sm:block text-sm font-medium text-[var(--foreground)] truncate max-w-[150px]">
                {user?.full_name || "User"}
              </span>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-2)] to-[var(--accent)] text-[var(--background)] font-semibold flex-shrink-0">
                {user?.full_name?.charAt(0).toUpperCase() || "U"}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden">
                <div className="p-4 border-b border-[var(--border)] text-center bg-[var(--panel)]">
                  <div className="flex justify-center mb-3">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent-2)] to-[var(--accent)] flex items-center justify-center text-[var(--background)] text-2xl font-bold shadow-lg">
                      {user?.full_name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  </div>
                  <p className="text-lg font-bold text-[var(--foreground)] truncate">
                    {user?.full_name || "User"}
                  </p>
                  <p className="text-sm text-[var(--muted)] truncate mt-1">
                    {user?.email || ""}
                  </p>
                </div>

                <div className="p-4 space-y-3">
                  {user?.phone && (
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
                        Phone
                      </label>
                      <p className="text-sm text-[var(--foreground)]">
                        {user.phone}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
                      Role
                    </label>
                    <span
                      className="inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize border"
                      style={badgeStyles(roleColor)}
                    >
                      {user?.global_role || user?.role || "member"}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
                      Status
                    </label>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border"
                      style={badgeStyles(
                        user?.is_active ? "var(--accent)" : "var(--muted)"
                      )}
                    >
                      <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{
                          backgroundColor: user?.is_active
                            ? "var(--accent)"
                            : "var(--muted)",
                        }}
                      />
                      {user?.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {(user?.flat_no || user?.wing) && (
                    <div className="flex gap-3">
                      {user?.flat_no && (
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
                            Flat No.
                          </label>
                          <p className="text-sm text-[var(--foreground)]">
                            {user.flat_no}
                          </p>
                        </div>
                      )}
                      {user?.wing && (
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
                            Wing
                          </label>
                          <p className="text-sm text-[var(--foreground)]">
                            {user.wing}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {(user?.global_role || user?.role) && (
                  <div className="px-4 py-3 bg-[var(--hover-bg)] border-t border-[var(--border)]">
                    <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
                      Role Description
                    </p>
                    <p className="text-xs text-[var(--foreground)] leading-relaxed">
                      {userRole === "developer" &&
                        "Full system access with developer tools and all administrative privileges."}
                      {userRole === "admin" &&
                        "Full administrative access to manage all aspects of the society."}
                      {userRole === "manager" &&
                        "Can create and manage AMCs, assets, and issues but cannot delete them."}
                      {userRole === "member" &&
                        "Can view society information and report issues."}
                    </p>
                  </div>
                )}

                <div className="border-t border-[var(--border)] py-1 bg-[var(--panel)]">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      router.push("/profile");
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-colors w-full"
                  >
                    <User className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-colors w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NavBar;
