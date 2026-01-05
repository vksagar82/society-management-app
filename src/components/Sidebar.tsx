"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { isAdmin } from "@/lib/auth/permissions";
import { SocietySelector } from "@/components/SocietySelector";
import {
  HomeIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CubeIcon,
  UsersIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowUpIcon,
  PowerIcon,
} from "@heroicons/react/24/outline";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  adminOnly?: boolean;
  developerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: HomeIcon,
  },
  {
    href: "/issues",
    label: "Issues",
    icon: ExclamationTriangleIcon,
  },
  {
    href: "/amcs",
    label: "AMCs",
    icon: DocumentTextIcon,
  },
  {
    href: "/assets",
    label: "Assets",
    icon: CubeIcon,
  },
  {
    href: "/societies",
    label: "Societies",
    icon: HomeIcon,
    developerOnly: true,
  },
  {
    href: "/developer",
    label: "Developer Panel",
    icon: CubeIcon,
    developerOnly: true,
  },
];

const ADMIN_ITEMS: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: HomeIcon,
    adminOnly: true,
  },
  {
    href: "/users",
    label: "User Management",
    icon: UsersIcon,
    adminOnly: true,
  },
  {
    href: "/admin/pending-approvals",
    label: "Pending Approvals",
    icon: ClockIcon,
    adminOnly: true,
  },
  {
    href: "/admin/api-scopes",
    label: "API Scopes",
    icon: CubeIcon,
    adminOnly: true,
    // Hide from admins; developers still see via developer role access
    developerOnly: true,
  },
  {
    href: "/admin/audit-logs",
    label: "Audit Logs",
    icon: DocumentTextIcon,
    adminOnly: true,
  },
];

export function Sidebar() {
  const { user, loading, logout, selectedSocietyId } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [hideOnScroll, setHideOnScroll] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [currentSocietyName, setCurrentSocietyName] = useState<string | null>(
    null
  );
  const [adminExpanded, setAdminExpanded] = useState(true);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false);
        setIsPinned(false);
      } else {
        setIsOpen(true);
        setIsPinned(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch current society name
  useEffect(() => {
    const fetchSocietyName = async () => {
      if (selectedSocietyId) {
        try {
          const token = localStorage.getItem("auth_token");
          const response = await fetch(`/api/societies`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const societies = await response.json();
            const selectedSociety = societies.find(
              (s: any) => s.id === selectedSocietyId
            );
            if (selectedSociety) {
              setCurrentSocietyName(selectedSociety.name);
            }
          }
        } catch (error) {
          console.error("Failed to fetch society name:", error);
        }
      }
    };

    if (selectedSocietyId && !loading) {
      fetchSocietyName();
    }
  }, [selectedSocietyId, loading]);

  // Auto-close sidebar on navigation (mobile only, unless pinned)
  useEffect(() => {
    if (isMobile && !isPinned) {
      setIsOpen(false);
    }
  }, [pathname, isMobile, isPinned]);

  // Hide sidebar on scroll down (desktop only)
  useEffect(() => {
    const mainElement = document.querySelector("main");

    const handleScroll = () => {
      const currentScrollY = mainElement?.scrollTop || window.scrollY;

      // On desktop, hide sidebar when scrolling down past 100px
      if (!isMobile) {
        if (currentScrollY < 100) {
          setHideOnScroll(false);
        } else if (currentScrollY > lastScrollY) {
          // Scrolling down
          setHideOnScroll(true);
        } else {
          // Scrolling up
          setHideOnScroll(false);
        }
      }

      setLastScrollY(currentScrollY);
    };

    const scrollElement = mainElement || window;
    scrollElement.addEventListener("scroll", handleScroll);
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isMobile]);

  const scrollToTop = () => {
    // Get the main element
    const mainElement = document.querySelector("main");

    if (mainElement) {
      // Method 1: Try scrolling the main element directly
      mainElement.scrollTop = 0;

      // Method 2: Scroll first child into view
      const firstChild = mainElement.firstElementChild;
      if (firstChild) {
        firstChild.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    // Method 3: Also try window scroll as fallback
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/");
  };

  // Get user's global role (fallback to role for backwards compatibility)
  const userRole = user?.global_role || user?.role;

  const visibleItems = NAV_ITEMS.filter((item) => {
    // Developers see everything - no restrictions
    if (userRole === "developer") return true;

    // Admins see admin items but not developer-only items
    if (userRole === "admin") {
      if (item.developerOnly) return false;
      return true;
    }

    // Other roles only see non-restricted items
    if (item.adminOnly || item.developerOnly) return false;
    return true;
  });

  // Preserve layout during auth bootstrap so space doesn't vanish on refresh
  if (loading) {
    return <div className="hidden md:block w-64 shrink-0" />;
  }

  if (!user) {
    return null;
  }

  // Calculate sidebar width based on state
  const getSidebarWidth = () => {
    if (isMobile) {
      return isOpen ? "w-64" : "w-0";
    }
    return isPinned ? "w-64" : "w-20";
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 md:hidden z-40 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white p-4 rounded-2xl shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 ring-4 ring-blue-100"
        aria-label="Toggle sidebar"
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <Bars3Icon className="w-6 h-6" />
        )}
      </button>

      {/* Desktop collapse button - outside sidebar */}
      {!isMobile && (
        <button
          onClick={() => setIsPinned(!isPinned)}
          className="hidden md:flex fixed left-64 top-6 z-50 p-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 ring-2 ring-blue-400/50"
          style={{ left: isPinned ? "256px" : "80px" }}
          title={isPinned ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isPinned ? (
            <ChevronLeftIcon className="w-5 h-5" />
          ) : (
            <ChevronRightIcon className="w-5 h-5" />
          )}
        </button>
      )}

      {/* Overlay for mobile */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 ease-in-out z-40 ${getSidebarWidth()} border-r border-slate-700/50 shadow-2xl ${
          hideOnScroll && !isMobile
            ? "md:-translate-x-full md:opacity-0"
            : "md:translate-x-0 md:opacity-100"
        }`}
        style={{ overflow: "visible" }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex flex-col border-b border-slate-700/50 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 backdrop-blur-sm">
            {/* Current Society Indicator (for developers) */}
            {userRole === "developer" &&
              currentSocietyName &&
              (isMobile ? isOpen : isPinned) && (
                <div className="px-6 pt-4 pb-2">
                  <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-lg px-3 py-2">
                    <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wider mb-1">
                      Current Society
                    </p>
                    <p className="text-sm text-white font-bold truncate">
                      {currentSocietyName}
                    </p>
                  </div>
                </div>
              )}

            <div className="flex items-center justify-between px-6 py-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 hover:opacity-80 transition-all duration-300 transform hover:scale-105"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg ring-2 ring-blue-400/50">
                  {user.full_name?.charAt(0).toUpperCase() || "U"}
                </div>
                {isMobile ? (
                  isOpen ? (
                    <div className="hidden md:block">
                      <p className="text-sm font-bold text-white tracking-wide">
                        {user.full_name}
                      </p>
                      <p className="text-xs text-blue-400 font-medium">
                        {user.email}
                      </p>
                    </div>
                  ) : null
                ) : isPinned ? (
                  <div className="hidden md:block">
                    <p className="text-sm font-bold text-white tracking-wide">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-blue-400 font-medium">
                      {user.email}
                    </p>
                  </div>
                ) : null}
              </Link>

              {/* Close button (mobile only) */}
              {isOpen && isMobile && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="md:hidden p-2 hover:bg-slate-700/70 rounded-lg transition-all duration-300 ml-auto hover:scale-110"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Society Selector */}
          {(isMobile ? isOpen : isPinned) && (
            <div className="px-3 py-3 border-b border-slate-700/50">
              <SocietySelector />
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 flex flex-col overflow-y-auto py-6 px-3 space-y-2 overflow-x-visible">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative transform hover:scale-102 ${
                    isActive(item.href)
                      ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-blue-500/30 scale-102"
                      : "text-slate-300 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-600/50 hover:text-white hover:shadow-lg"
                  } ${
                    isMobile
                      ? isOpen
                        ? ""
                        : "justify-center"
                      : isPinned
                      ? ""
                      : "justify-center"
                  }`}
                  title={
                    (isMobile && !isOpen) || (!isMobile && !isPinned)
                      ? item.label
                      : ""
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isMobile ? (
                    isOpen ? (
                      <span className="text-sm font-semibold tracking-wide">
                        {item.label}
                      </span>
                    ) : null
                  ) : isPinned ? (
                    <span className="text-sm font-semibold tracking-wide">
                      {item.label}
                    </span>
                  ) : null}
                  {(isMobile && !isOpen) || (!isMobile && !isPinned) ? (
                    <div className="absolute left-full ml-3 hidden group-hover:block bg-gradient-to-r from-slate-700 to-slate-600 text-white text-sm font-medium px-3 py-2 rounded-lg whitespace-nowrap z-50 shadow-xl">
                      {item.label}
                      <div className="absolute top-1/2 right-full -translate-y-1/2 border-8 border-transparent border-r-slate-700" />
                    </div>
                  ) : null}
                </Link>
              );
            })}

            {/* Admin Section */}
            {(userRole === "admin" || userRole === "developer") && (
              <div>
                <button
                  onClick={() => setAdminExpanded(!adminExpanded)}
                  type="button"
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 text-slate-300 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-600/50 hover:text-white"
                >
                  <UsersIcon className="w-5 h-5 flex-shrink-0" />
                  {((isMobile && isOpen) || (!isMobile && isPinned)) && (
                    <>
                      <span className="text-sm font-semibold tracking-wide flex-1 text-left">
                        Admin {currentSocietyName && `- ${currentSocietyName}`}
                      </span>
                      <ChevronRightIcon
                        className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${
                          adminExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </>
                  )}
                </button>
                {/* Dropdown menu within sidebar */}
                {adminExpanded && (
                  <div className="pl-4 mt-2 space-y-1">
                    {ADMIN_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                            isActive(item.href)
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                              : "text-slate-300 hover:bg-slate-600/50 hover:text-white"
                          }`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="mt-auto pt-4">
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  router.push("/auth/login");
                }}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative transform hover:scale-102 text-slate-300 hover:bg-gradient-to-r hover:from-red-700/60 hover:to-rose-600/60 hover:text-white hover:shadow-lg ${
                  isMobile
                    ? isOpen
                      ? ""
                      : "justify-center"
                    : isPinned
                    ? ""
                    : "justify-center"
                }`}
                title={
                  (isMobile && !isOpen) || (!isMobile && !isPinned)
                    ? "Logout"
                    : ""
                }
              >
                <PowerIcon className="w-5 h-5 flex-shrink-0" />
                {isMobile ? (
                  isOpen ? (
                    <span className="text-sm font-semibold tracking-wide">
                      Logout
                    </span>
                  ) : null
                ) : isPinned ? (
                  <span className="text-sm font-semibold tracking-wide">
                    Logout
                  </span>
                ) : null}
                {(isMobile && !isOpen) || (!isMobile && !isPinned) ? (
                  <div className="absolute left-full ml-3 hidden group-hover:block bg-gradient-to-r from-red-700 to-rose-600 text-white text-sm font-medium px-3 py-2 rounded-lg whitespace-nowrap z-50 shadow-xl">
                    Logout
                    <div className="absolute top-1/2 right-full -translate-y-1/2 border-8 border-transparent border-r-red-700" />
                  </div>
                ) : null}
              </button>
            </div>
          </nav>

          {/* Footer - User Info */}
          <div className="border-t border-slate-700/50 p-4 bg-gradient-to-t from-slate-900 via-slate-800 to-slate-900 backdrop-blur-sm space-y-3">
            <Link
              href="/profile"
              className={`flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-600/50 hover:text-white hover:shadow-lg group transform hover:scale-102 ${
                isMobile
                  ? isOpen
                    ? ""
                    : "justify-center"
                  : isPinned
                  ? ""
                  : "justify-center"
              }`}
              title={
                (isMobile && !isOpen) || (!isMobile && !isPinned)
                  ? "Profile"
                  : ""
              }
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-lg ring-2 ring-blue-400/50">
                {user.full_name?.charAt(0).toUpperCase() || "U"}
              </div>
              {isMobile ? (
                isOpen ? (
                  <div className="min-w-0 hidden md:block">
                    <p className="text-sm font-bold text-white truncate tracking-wide">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>
                ) : null
              ) : isPinned ? (
                <div className="min-w-0 hidden md:block">
                  <p className="text-sm font-bold text-white truncate tracking-wide">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
              ) : null}
              {(isMobile && !isOpen) || (!isMobile && !isPinned) ? (
                <div className="absolute left-full ml-3 hidden group-hover:block bg-gradient-to-r from-slate-700 to-slate-600 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-50 w-max shadow-xl">
                  <p className="font-bold">{user.full_name}</p>
                  <p className="text-slate-300">{user.email}</p>
                  <div className="absolute top-1/2 right-full -translate-y-1/2 border-8 border-transparent border-r-slate-700" />
                </div>
              ) : null}
            </Link>

            {/* Back to Top Button */}
            <button
              type="button"
              onClick={scrollToTop}
              className={`flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-300 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl hover:shadow-blue-500/50 hover:scale-105 group mt-3 ${
                isMobile
                  ? isOpen
                    ? ""
                    : "justify-center"
                  : isPinned
                  ? ""
                  : "justify-center"
              }`}
              title={
                (isMobile && !isOpen) || (!isMobile && !isPinned)
                  ? "Back to Top"
                  : ""
              }
            >
              <ArrowUpIcon className="w-5 h-5 flex-shrink-0" />
              {isMobile ? (
                isOpen ? (
                  <span className="text-sm font-bold tracking-wide">
                    Back to Top
                  </span>
                ) : null
              ) : isPinned ? (
                <span className="text-sm font-bold tracking-wide">
                  Back to Top
                </span>
              ) : null}
              {(isMobile && !isOpen) || (!isMobile && !isPinned) ? (
                <div className="absolute left-full ml-3 hidden group-hover:block bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium px-3 py-2 rounded-lg whitespace-nowrap z-50 shadow-xl">
                  Back to Top
                  <div className="absolute top-1/2 right-full -translate-y-1/2 border-8 border-transparent border-r-blue-600" />
                </div>
              ) : null}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
