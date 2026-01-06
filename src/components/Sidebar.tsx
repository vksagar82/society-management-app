"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useTheme } from "@/lib/theme/context";
import {
  HomeIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CubeIcon,
  UsersIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowUpIcon,
  PowerIcon,
  ShieldCheckIcon,
  CodeBracketSquareIcon,
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
  const { theme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hideOnScroll, setHideOnScroll] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [currentSocietyName, setCurrentSocietyName] = useState<string | null>(
    null
  );
  const [adminExpanded, setAdminExpanded] = useState(true);
  const [developerExpanded, setDeveloperExpanded] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false);
        setIsPinned(false);
      } else {
        setIsOpen(true);
        setIsPinned(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  useEffect(() => {
    if (isMobile && !isPinned) {
      setIsOpen(false);
    }
  }, [pathname, isMobile, isPinned]);

  useEffect(() => {
    const mainElement = document.querySelector("main");

    const handleScroll = () => {
      const currentScrollY = mainElement?.scrollTop || window.scrollY;

      if (!isMobile) {
        if (currentScrollY < 100) {
          setHideOnScroll(false);
        } else if (currentScrollY > lastScrollY) {
          setHideOnScroll(true);
        } else {
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
    const mainElement = document.querySelector("main");

    if (mainElement) {
      mainElement.scrollTop = 0;

      const firstChild = mainElement.firstElementChild;
      if (firstChild) {
        firstChild.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const userRole = user?.global_role || user?.role;

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (userRole === "developer") return true;

    if (userRole === "admin") {
      if (item.developerOnly) return false;
      return true;
    }

    if (item.adminOnly || item.developerOnly) return false;
    return true;
  });

  if (loading) {
    return <div className="hidden md:block w-64 shrink-0" />;
  }

  if (!user) {
    return null;
  }

  const getSidebarWidth = () => {
    if (isMobile) {
      return isOpen ? "w-64" : "w-0";
    }
    return isPinned ? "w-64" : "w-20";
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 md:hidden z-40 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-[var(--foreground)] p-4 rounded-2xl shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 ring-4 ring-blue-100"
        aria-label="Toggle sidebar"
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <Bars3Icon className="w-6 h-6" />
        )}
      </button>

      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        data-theme={theme}
        className={`fixed md:sticky top-0 left-0 h-screen bg-[var(--sidebar-bg)] text-[var(--foreground)] transition-all duration-300 ease-in-out z-40 ${getSidebarWidth()} border-r border-[var(--border)] shadow-[0_24px_80px_rgba(0,0,0,0.45)] ${
          hideOnScroll && !isMobile
            ? "md:-translate-x-full md:opacity-0"
            : "md:translate-x-0 md:opacity-100"
        }`}
        style={{ overflow: "hidden" }}
      >
        {!isMobile && (
          <button
            onClick={() => setIsPinned(!isPinned)}
            className="hidden md:block absolute top-1/2 -translate-y-1/2 -right-3 z-50 bg-gradient-to-br from-blue-600 to-indigo-600 text-[var(--foreground)] rounded-full shadow-xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 ring-2 ring-blue-400/50 w-6 h-12 flex items-center justify-center"
            title={isPinned ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isPinned ? (
              <ChevronLeftIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
        )}

        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex flex-col border-b border-[var(--border)] bg-[var(--sidebar-bg)] backdrop-blur-xl shrink-0">
            {userRole === "developer" &&
              currentSocietyName &&
              (isMobile ? isOpen : isPinned) && (
                <div className="px-6 pt-4 pb-2">
                  <div className="bg-[var(--hover-bg)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-inner">
                    <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider mb-1">
                      Current Society
                    </p>
                    <p className="text-sm text-[var(--foreground)] font-semibold truncate">
                      {currentSocietyName}
                    </p>
                  </div>
                </div>
              )}

            {isOpen && isMobile && (
              <div className="flex items-center justify-end px-6 py-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="md:hidden p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-all duration-300 hover:scale-110"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <nav className="flex-1 flex flex-col overflow-y-auto py-6 px-3 space-y-2 min-h-0">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-200 group relative ${
                    isActive(item.href)
                      ? "bg-[var(--active-bg)] text-[var(--foreground)] border-cyan-300/40 shadow-lg shadow-cyan-500/15"
                      : "bg-[var(--hover-bg)] text-[var(--foreground)] border-transparent hover:bg-[var(--active-bg)] hover:border-[var(--border)]"
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
                  {((isMobile && isOpen) || (!isMobile && isPinned)) && (
                    <span className="text-sm font-semibold tracking-wide">
                      {item.label}
                    </span>
                  )}
                  {((isMobile && !isOpen) || (!isMobile && !isPinned)) && (
                    <div className="absolute left-full ml-3 hidden group-hover:block bg-[var(--sidebar-bg)] text-[var(--foreground)] text-sm font-medium px-3 py-2 rounded-lg whitespace-nowrap z-50 shadow-xl border border-[var(--border)]">
                      {item.label}
                      <div className="absolute top-1/2 right-full -translate-y-1/2 border-8 border-transparent border-r-[var(--sidebar-bg)]" />
                    </div>
                  )}
                </Link>
              );
            })}

            {(userRole === "admin" || userRole === "developer") && (
              <div>
                <Link
                  href="/admin"
                  onClick={(e) => {
                    if (
                      e.target instanceof HTMLElement &&
                      e.target.closest(".chevron-toggle")
                    ) {
                      e.preventDefault();
                      setAdminExpanded(!adminExpanded);
                    }
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 border ${
                    isActive("/admin")
                      ? "bg-[var(--active-bg)] text-[var(--foreground)] border-orange-300/40 shadow-lg shadow-orange-500/15"
                      : "text-[var(--foreground)] border-transparent hover:border-[var(--border)] hover:bg-[var(--hover-bg)]"
                  }`}
                >
                  <ShieldCheckIcon className="w-5 h-5 flex-shrink-0 text-orange-400" />
                  {((isMobile && isOpen) || (!isMobile && isPinned)) && (
                    <>
                      <span className="text-sm font-semibold tracking-wide flex-1 text-left">
                        Admin Dashboard
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setAdminExpanded(!adminExpanded);
                        }}
                        className="chevron-toggle p-1 hover:bg-[var(--hover-bg)] rounded transition-colors"
                      >
                        <ChevronRightIcon
                          className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${
                            adminExpanded ? "rotate-90" : ""
                          }`}
                        />
                      </button>
                    </>
                  )}
                </Link>
                {adminExpanded &&
                  ((isMobile && isOpen) || (!isMobile && isPinned)) && (
                    <div className="pl-4 mt-2 space-y-1">
                      {ADMIN_ITEMS.filter((item) => item.href !== "/admin").map(
                        (item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                                isActive(item.href)
                                  ? "bg-[var(--active-bg)] text-[var(--foreground)] border border-orange-300/40 shadow-lg shadow-orange-500/10"
                                  : "text-[var(--foreground)] hover:bg-[var(--active-bg)] border border-transparent hover:border-[var(--border)]"
                              }`}
                            >
                              <Icon className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm font-medium">
                                {item.label}
                              </span>
                            </Link>
                          );
                        }
                      )}
                    </div>
                  )}
              </div>
            )}

            {userRole === "developer" && (
              <div>
                <Link
                  href="/developer"
                  onClick={(e) => {
                    if (
                      e.target instanceof HTMLElement &&
                      e.target.closest(".chevron-toggle")
                    ) {
                      e.preventDefault();
                      setDeveloperExpanded(!developerExpanded);
                    }
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 border ${
                    isActive("/developer")
                      ? "bg-[var(--active-bg)] text-[var(--foreground)] border-purple-300/40 shadow-lg shadow-purple-500/15"
                      : "text-[var(--foreground)] border-transparent hover:border-[var(--border)] hover:bg-[var(--hover-bg)]"
                  }`}
                >
                  <CodeBracketSquareIcon className="w-5 h-5 flex-shrink-0 text-purple-400" />
                  {((isMobile && isOpen) || (!isMobile && isPinned)) && (
                    <>
                      <span className="text-sm font-semibold tracking-wide flex-1 text-left">
                        Developer Dashboard
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setDeveloperExpanded(!developerExpanded);
                        }}
                        className="chevron-toggle p-1 hover:bg-[var(--hover-bg)] rounded transition-colors"
                      >
                        <ChevronRightIcon
                          className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${
                            developerExpanded ? "rotate-90" : ""
                          }`}
                        />
                      </button>
                    </>
                  )}
                </Link>
                {developerExpanded &&
                  ((isMobile && isOpen) || (!isMobile && isPinned)) && (
                    <div className="pl-4 mt-2 space-y-1">
                      <Link
                        href="/developer/api-scopes"
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive("/developer/api-scopes")
                            ? "bg-[var(--active-bg)] text-[var(--foreground)] border border-purple-300/40 shadow-lg shadow-purple-500/10"
                            : "text-[var(--foreground)] hover:bg-[var(--active-bg)] border border-transparent hover:border-[var(--border)]"
                        }`}
                      >
                        <CubeIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">API Scopes</span>
                      </Link>
                      <Link
                        href="/developer/database-status"
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive("/developer/database-status")
                            ? "bg-[var(--active-bg)] text-[var(--foreground)] border border-purple-300/40 shadow-lg shadow-purple-500/10"
                            : "text-[var(--foreground)] hover:bg-[var(--active-bg)] border border-transparent hover:border-[var(--border)]"
                        }`}
                      >
                        <ArrowUpIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          Database Status
                        </span>
                      </Link>
                      <Link
                        href="/developer/cache-status"
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive("/developer/cache-status")
                            ? "bg-[var(--active-bg)] text-[var(--foreground)] border border-purple-300/40 shadow-lg shadow-purple-500/10"
                            : "text-[var(--foreground)] hover:bg-[var(--active-bg)] border border-transparent hover:border-[var(--border)]"
                        }`}
                      >
                        <ClockIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          Cache Status
                        </span>
                      </Link>
                    </div>
                  )}
              </div>
            )}
          </nav>

          <div className="border-t border-[var(--border)] p-4 bg-[var(--sidebar-bg)] backdrop-blur-sm shrink-0">
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.push("/auth/login");
              }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative text-rose-100 border border-transparent hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-[var(--foreground)] ${
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
              {((isMobile && isOpen) || (!isMobile && isPinned)) && (
                <span className="text-sm font-semibold tracking-wide">
                  Logout
                </span>
              )}
              {((isMobile && !isOpen) || (!isMobile && !isPinned)) && (
                <div className="absolute left-full ml-3 hidden group-hover:block bg-gradient-to-r from-red-700 to-rose-600 text-[var(--foreground)] text-sm font-medium px-3 py-2 rounded-lg whitespace-nowrap z-50 shadow-xl">
                  Logout
                  <div className="absolute top-1/2 right-full -translate-y-1/2 border-8 border-transparent border-r-red-700" />
                </div>
              )}
            </button>
          </div>

          <div className="border-t border-[var(--border)] p-4 bg-gradient-to-t from-slate-900 via-slate-800 to-slate-900 backdrop-blur-sm shrink-0">
            <button
              type="button"
              onClick={scrollToTop}
              className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-300 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-[var(--foreground)] shadow-xl hover:shadow-blue-500/50 hover:scale-105 group ${
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
              {((isMobile && isOpen) || (!isMobile && isPinned)) && (
                <span className="text-sm font-bold tracking-wide">
                  Back to Top
                </span>
              )}
              {((isMobile && !isOpen) || (!isMobile && !isPinned)) && (
                <div className="absolute left-full ml-3 hidden group-hover:block bg-gradient-to-r from-blue-600 to-indigo-600 text-[var(--foreground)] text-sm font-medium px-3 py-2 rounded-lg whitespace-nowrap z-50 shadow-xl">
                  Back to Top
                  <div className="absolute top-1/2 right-full -translate-y-1/2 border-8 border-transparent border-r-blue-600" />
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
