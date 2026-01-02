"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { isAdmin } from "@/lib/auth/permissions";

export function NavBar() {
  const { user, loading, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="animate-pulse h-8 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href={user ? "/dashboard" : "/auth/login"}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              S
            </div>
            <span className="font-bold text-lg text-gray-900">
              Society Manager
            </span>
          </Link>

          {user && (
            <div className="hidden md:flex gap-8">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/issues"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Issues
              </Link>
              <Link
                href="/amcs"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                AMCs
              </Link>
              <Link
                href="/assets"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Assets
              </Link>
              {isAdmin(user) && (
                <Link
                  href="/users"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Users
                </Link>
              )}
            </div>
          )}

          <div className="relative">
            {user ? (
              <>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold hover:bg-blue-700 transition-colors"
                >
                  {user.full_name.charAt(0).toUpperCase()}
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.full_name}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-blue-600 mt-1 capitalize font-medium">
                        {user.role}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                    >
                      Profile
                    </Link>
                    {isAdmin(user) && (
                      <Link
                        href="/users"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                      >
                        Manage Users
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
