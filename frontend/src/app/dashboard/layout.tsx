'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  logout,
  getCurrentUser,
  restoreSession,
} from '@/store/slices/authSlice'
import { TopNav } from '@/components/TopNav'
import { ThemePalette } from '@/components/ThemePalette'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Users,
  Building2,
  FileText,
  Settings,
  LogOut,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Users', href: '/dashboard/users' },
  { icon: Building2, label: 'Societies', href: '/dashboard/societies' },
  { icon: FileText, label: 'Issues', href: '/dashboard/issues' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

const developerMenuItems = [
  {
    icon: CheckCircle,
    label: 'Approve Societies',
    href: '/dashboard/societies/approve',
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { user, isAuthenticated } = useAppSelector(state => state.auth)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    // Restore session on mount
    dispatch(restoreSession())
  }, [dispatch])

  useEffect(() => {
    // Check authentication
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('access_token')
        : null
    if (!token && !isAuthenticated) {
      router.push('/auth/login')
    } else if (token && !user) {
      dispatch(getCurrentUser())
    }
  }, [isAuthenticated, user, router, dispatch])

  useEffect(() => {
    // Check approval status and redirect if needed
    // Developers have global access - skip approval check
    if (user && user.global_role !== 'developer' && user.user_societies) {
      const hasApprovedSociety = user.user_societies.some(
        (us: any) => us.approval_status === 'approved'
      )

      // If user has no societies or all are pending/rejected, redirect to pending page
      if (user.user_societies.length === 0 || !hasApprovedSociety) {
        const currentPath = window.location.pathname
        if (currentPath !== '/dashboard/pending-approval') {
          router.push('/dashboard/pending-approval')
        }
      }
    }
  }, [user, router])

  const handleLogout = () => {
    dispatch(logout())
    router.push('/auth/login')
  }

  // Check if user is on pending approval page
  const isPendingApprovalPage = pathname === '/dashboard/pending-approval'

  // Synchronous approval check to prevent flashing protected content
  const isApproved =
    user?.global_role === 'developer' ||
    user?.user_societies?.some((us: any) => us.approval_status === 'approved')

  useEffect(() => {
    if (!user) return
    if (!isApproved && !isPendingApprovalPage) {
      router.replace('/dashboard/pending-approval')
    }
  }, [user, isApproved, isPendingApprovalPage, router])

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-b-2"></div>
      </div>
    )
  }

  if (!isApproved && !isPendingApprovalPage) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-b-2"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0A' }}>
      {!isPendingApprovalPage && (
        <>
          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
              />
            )}
          </AnimatePresence>

          {/* Sidebar */}
          <aside
            className={`fixed top-0 left-0 z-50 h-screen transition-all duration-300 lg:translate-x-0 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } ${sidebarCollapsed ? 'w-20' : 'w-64'}`}
            style={{
              backgroundColor: '#0F0F0F',
              borderRight: '1px solid #1A1A1A',
            }}
          >
            <div className="flex h-full flex-col py-6">
              {/* Logo */}
              <div
                className={`mb-8 px-6 ${sidebarCollapsed ? 'px-3' : 'px-6'}`}
              >
                <Link href="/dashboard" className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl shadow-lg"
                    style={{ backgroundColor: 'hsl(var(--primary))' }}
                  >
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  {!sidebarCollapsed && (
                    <div>
                      <h1 className="text-lg font-bold text-white">Society</h1>
                      <p className="text-xs text-gray-500">Management</p>
                    </div>
                  )}
                </Link>
              </div>

              {/* Collapse Button */}
              <div className={`mb-4 hidden px-3 lg:block`}>
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="flex w-full items-center justify-center rounded-lg p-2 transition-all hover:bg-white/5"
                  title={
                    sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
                  }
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronLeft className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Navigation Menu */}
              <nav className="flex flex-1 flex-col gap-2 px-3">
                {menuItems.map(item => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className="group relative"
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <div
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                          sidebarCollapsed ? 'justify-center' : ''
                        } ${isActive ? 'shadow-lg' : 'hover:bg-white/5'}`}
                        style={
                          isActive
                            ? {
                                backgroundColor: 'hsl(var(--primary))',
                                boxShadow:
                                  '0 4px 12px hsl(var(--primary) / 0.3)',
                              }
                            : {}
                        }
                      >
                        <Icon
                          className={`h-5 w-5 flex-shrink-0 ${
                            isActive
                              ? 'text-white'
                              : 'text-gray-400 group-hover:text-white'
                          }`}
                        />
                        {!sidebarCollapsed && (
                          <span
                            className={`text-sm font-medium ${
                              isActive
                                ? 'text-white'
                                : 'text-gray-400 group-hover:text-white'
                            }`}
                          >
                            {item.label}
                          </span>
                        )}
                      </div>
                      {isActive && !sidebarCollapsed && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute top-0 bottom-0 left-0 w-1 rounded-r-full"
                          style={{ backgroundColor: 'hsl(var(--primary))' }}
                        />
                      )}
                    </Link>
                  )
                })}

                {/* Developer-only menu items */}
                {user?.global_role === 'developer' && (
                  <>
                    {!sidebarCollapsed && (
                      <div className="px-4 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                        Developer
                      </div>
                    )}
                    {developerMenuItems.map(item => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className="group relative"
                          title={sidebarCollapsed ? item.label : undefined}
                        >
                          <div
                            className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                              sidebarCollapsed ? 'justify-center' : ''
                            } ${isActive ? 'shadow-lg' : 'hover:bg-white/5'}`}
                            style={
                              isActive
                                ? {
                                    backgroundColor: 'hsl(var(--primary))',
                                    boxShadow:
                                      '0 4px 12px hsl(var(--primary) / 0.3)',
                                  }
                                : {}
                            }
                          >
                            <Icon
                              className={`h-5 w-5 flex-shrink-0 ${
                                isActive
                                  ? 'text-white'
                                  : 'text-gray-400 group-hover:text-white'
                              }`}
                            />
                            {!sidebarCollapsed && (
                              <span
                                className={`text-sm font-medium ${
                                  isActive
                                    ? 'text-white'
                                    : 'text-gray-400 group-hover:text-white'
                                }`}
                              >
                                {item.label}
                              </span>
                            )}
                          </div>
                          {isActive && !sidebarCollapsed && (
                            <motion.div
                              layoutId="activeTab"
                              className="absolute top-0 bottom-0 left-0 w-1 rounded-r-full"
                              style={{ backgroundColor: 'hsl(var(--primary))' }}
                            />
                          )}
                        </Link>
                      )
                    })}
                  </>
                )}
              </nav>

              {/* User Profile Section */}
              <div
                className={`border-t border-gray-800 px-6 pt-4 ${
                  sidebarCollapsed ? 'px-3' : 'px-6'
                }`}
              >
                <div
                  className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all hover:bg-white/5 ${
                    sidebarCollapsed ? 'justify-center' : ''
                  }`}
                >
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold shadow-lg"
                    style={{ backgroundColor: 'hsl(var(--primary))' }}
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
                  {!sidebarCollapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {user.full_name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {user.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Close button for mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="mt-4 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5 text-gray-400" />
              </Button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div
        className={`min-h-screen transition-all duration-300 ${
          !isPendingApprovalPage && (sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64')
        }`}
      >
        {/* Top Navigation */}
        {!isPendingApprovalPage && (
          <TopNav
            user={{
              full_name: user.full_name,
              email: user.email,
              role: user.global_role || user.role,
              avatar_url: user.avatar_url,
            }}
            onLogout={handleLogout}
            onToggleSidebar={() => setSidebarOpen(true)}
            showMenuButton={true}
          />
        )}

        {/* Page Content */}
        <main
          className="min-h-[calc(100vh-4rem)]"
          style={{ backgroundColor: '#0A0A0A' }}
        >
          {children}
        </main>
      </div>

      {/* Theme Palette Selector */}
      <ThemePalette />
    </div>
  )
}
