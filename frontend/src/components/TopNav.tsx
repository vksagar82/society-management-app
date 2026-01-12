"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bell,
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";

interface TopNavProps {
  user: {
    full_name: string;
    email: string;
    role?: string;
    avatar_url?: string;
  };
  onLogout: () => void;
  onToggleSidebar?: () => void;
  showMenuButton?: boolean;
}

export function TopNav({
  user,
  onLogout,
  onToggleSidebar,
  showMenuButton,
}: TopNavProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const notifications = [
    { id: 1, title: "New issue reported", time: "5 min ago", unread: true },
    { id: 2, title: "Payment received", time: "1 hour ago", unread: true },
    {
      id: 3,
      title: "Society meeting scheduled",
      time: "2 hours ago",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-md shadow-sm"
      style={{ backgroundColor: "#0F0F0F", borderBottom: "1px solid #1A1A1A" }}
    >
      <div className="flex items-center justify-between px-6 py-4 gap-4">
        {/* Left side - Menu button & Title */}
        <div className="flex items-center gap-3 flex-1">
          {showMenuButton && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-gray-400 hover:text-white hover:bg-white/5"
              onClick={onToggleSidebar}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </Button>
          )}

          <div className="hidden md:block">
            <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          </div>
        </div>

        {/* Right side - Actions & User */}
        <div className="flex items-center gap-2">
          {/* Search button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-white/5"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Refresh button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-white/5"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          </Button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative text-gray-400 hover:text-white hover:bg-white/5"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full"
                  style={{ backgroundColor: "hsl(var(--primary))" }}
                />
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-96 rounded-xl shadow-2xl z-40 overflow-hidden"
                style={{
                  backgroundColor: "#1A1A1A",
                  border: "1px solid #2A2A2A",
                }}
              >
                <div
                  className="p-4"
                  style={{
                    borderBottom: "1px solid #2A2A2A",
                    background:
                      "linear-gradient(to right, hsl(var(--primary) / 0.1), transparent)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-white">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium text-white"
                        style={{ backgroundColor: "hsl(var(--primary))" }}
                      >
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      className={`w-full p-4 text-left hover:bg-white/5 transition-all group ${
                        notif.unread ? "bg-white/5" : ""
                      }`}
                      style={{ borderBottom: "1px solid #2A2A2A" }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{
                            backgroundColor: notif.unread
                              ? "hsl(var(--primary) / 0.1)"
                              : "#2A2A2A",
                          }}
                        >
                          <Bell
                            className="h-4 w-4"
                            style={{
                              color: notif.unread
                                ? "hsl(var(--primary))"
                                : "#666",
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white group-hover:text-white transition-colors">
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notif.time}
                          </p>
                        </div>
                        {notif.unread && (
                          <div
                            className="h-2 w-2 rounded-full mt-1.5"
                            style={{ backgroundColor: "hsl(var(--primary))" }}
                          ></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="p-3" style={{ borderTop: "1px solid #2A2A2A" }}>
                  <Button
                    variant="ghost"
                    className="w-full text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5"
                    size="sm"
                  >
                    View all notifications
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-all"
            >
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm shadow-md"
                style={{
                  background:
                    "linear-gradient(to bottom right, hsl(var(--primary)), hsl(var(--primary) / 0.6))",
                }}
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
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-white">
                  {user.full_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user.role || "User"}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500 hidden md:block" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-xl shadow-2xl z-40 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: "#1A1A1A",
                  border: "1px solid #2A2A2A",
                }}
              >
                <div
                  className="p-4"
                  style={{
                    borderBottom: "1px solid #2A2A2A",
                    background:
                      "linear-gradient(to right, hsl(var(--primary) / 0.1), transparent)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center font-bold shadow-md"
                      style={{
                        background:
                          "linear-gradient(to bottom right, hsl(var(--primary)), hsl(var(--primary) / 0.6))",
                      }}
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
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-white">
                        {user.full_name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <Link href="/dashboard/settings?tab=profile">
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-all font-medium group"
                    >
                      <User className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      Profile
                    </button>
                  </Link>
                  <Link href="/dashboard/settings">
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-all font-medium group"
                    >
                      <Settings className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      Settings
                    </button>
                  </Link>
                  <Link href="/dashboard/change-password">
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-all font-medium group"
                    >
                      <Key className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      Change Password
                    </button>
                  </Link>
                </div>
                <div className="p-2" style={{ borderTop: "1px solid #2A2A2A" }}>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg hover:bg-red-500/10 transition-all font-medium group"
                    style={{ color: "#EF4444" }}
                  >
                    <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
