'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/store/hooks'

interface ProtectedRouteProps {
  children: ReactNode
  requireApproval?: boolean
}

export function ProtectedRoute({
  children,
  requireApproval = true,
}: ProtectedRouteProps) {
  const router = useRouter()
  const { user } = useAppSelector(state => state.auth)
  const [isChecking, setIsChecking] = useState(true)

  // Immediate synchronous permission check
  const hasPermission =
    user &&
    (user.global_role === 'developer' ||
      !requireApproval ||
      user.user_societies?.some((us: any) => us.approval_status === 'approved'))

  useEffect(() => {
    // Wait for user data to be loaded
    if (!user) {
      setIsChecking(true)
      return
    }

    // Check permission
    if (!hasPermission) {
      setIsChecking(true)
      router.replace('/dashboard/pending-approval')
      return
    }

    // User is loaded and has permission
    setIsChecking(false)
  }, [user, hasPermission, router])

  // Don't render anything until we've checked permissions
  if (isChecking || !user || !hasPermission) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: '#0A0A0A' }}
      >
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-gray-500">Checking permissions...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
