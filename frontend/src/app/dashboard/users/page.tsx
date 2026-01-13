'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Search,
  UserPlus,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Edit,
  Star,
  Phone,
  X,
  Calendar,
  Building2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { api } from '@/lib/api'
import { User } from '@/store/slices/authSlice'
import { useAppSelector } from '@/store/hooks'
import { ProtectedRoute } from '@/components/ProtectedRoute'

function UsersPageContent() {
  const router = useRouter()
  const { user: currentUser } = useAppSelector(state => state.auth)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [societyLookup, setSocietyLookup] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
    fetchSocieties()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await api.get<User[]>('/api/v1/users/')
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSocieties = async () => {
    try {
      const data = await api.get<Array<{ id: string; name: string }>>(
        '/api/v1/societies'
      )

      const lookup = data.reduce<Record<string, string>>((acc, society) => {
        acc[society.id] = society.name
        return acc
      }, {})

      setSocietyLookup(lookup)
    } catch (error) {
      console.error('Failed to fetch societies:', error)
    }
  }

  const isCurrentUser = (userId: string) => currentUser?.id === userId
  const canManageStatus =
    currentUser?.global_role === 'developer' ||
    currentUser?.global_role === 'admin'
  const canManageMembership = (societyId: string) => {
    if (currentUser?.global_role === 'developer') return true
    const membership = currentUser?.user_societies?.find(
      us => us.society_id === societyId
    )
    return membership?.role === 'admin'
  }

  const filteredUsers = users.filter(
    user =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.global_role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleActivation = async (user: User) => {
    if (!canManageStatus || isCurrentUser(user.id)) return
    const nextStatus = !user.is_active
    try {
      setUpdatingUserId(user.id)
      const updated = await api.put<User>(`/api/v1/users/${user.id}`, {
        is_active: nextStatus,
      })

      setUsers(prev =>
        prev.map(u =>
          u.id === user.id ? { ...u, is_active: updated.is_active } : u
        )
      )

      setSelectedUser(prev =>
        prev && prev.id === user.id
          ? { ...prev, is_active: updated.is_active }
          : prev
      )
    } catch (error) {
      console.error('Failed to update user status', error)
    } finally {
      setUpdatingUserId(null)
    }
  }

  const updateUser = async (
    userId: string,
    payload: Partial<Pick<User, 'is_active' | 'global_role'>>
  ) => {
    try {
      setUpdatingUserId(userId)
      const updated = await api.put<User>(`/api/v1/users/${userId}`, payload)

      setUsers(prev => prev.map(u => (u.id === userId ? updated : u)))
      setSelectedUser(prev => (prev && prev.id === userId ? updated : prev))
    } catch (error) {
      console.error('Failed to update user', error)
    } finally {
      setUpdatingUserId(null)
    }
  }

  const updateMembershipState = (
    userId: string,
    membershipId: string,
    updater: (m: any) => any
  ) => {
    setUsers(prev =>
      prev.map(u =>
        u.id !== userId
          ? u
          : {
              ...u,
              user_societies: u.user_societies?.map(m =>
                m.id === membershipId ? updater(m) : m
              ),
            }
      )
    )

    setSelectedUser(prev =>
      prev && prev.id === userId
        ? {
            ...prev,
            user_societies: prev.user_societies?.map(m =>
              m.id === membershipId ? updater(m) : m
            ),
          }
        : prev
    )
  }

  const approveMembership = async (membership: any, userId: string) => {
    if (!canManageMembership(membership.society_id)) return
    try {
      setUpdatingUserId(membership.id)
      await api.post(`/api/v1/societies/${membership.society_id}/approve`, {
        user_society_id: membership.id,
        approved: true,
      })

      updateMembershipState(userId, membership.id, m => ({
        ...m,
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
      }))
    } catch (error) {
      console.error('Failed to approve membership', error)
    } finally {
      setUpdatingUserId(null)
    }
  }

  return (
    <div
      className="space-y-4 p-4 sm:space-y-6 sm:p-6"
      style={{ backgroundColor: '#0A0A0A', minHeight: 'calc(100vh - 4rem)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white sm:text-3xl">
              <Users
                className="h-6 w-6 sm:h-8 sm:w-8"
                style={{ color: 'hsl(var(--primary))' }}
              />
              User Management
            </h1>
            <p className="mt-1 text-sm text-gray-500 sm:text-base">
              Manage and view all registered users
            </p>
          </div>
          <Button
            className="w-full sm:w-auto"
            style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        <Card className="mb-6 border-0" style={{ backgroundColor: '#141414' }}>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search users by name or email..."
                className="border-gray-800 bg-black/50 pl-10 text-white placeholder:text-gray-600"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <div
              className="h-12 w-12 animate-spin rounded-full border-b-2"
              style={{ borderColor: 'hsl(var(--primary))' }}
            ></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card className="border-0" style={{ backgroundColor: '#141414' }}>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-gray-600" />
              <h3 className="mb-2 text-lg font-semibold text-white">
                No users found
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? 'Try adjusting your search criteria'
                  : 'No users have been registered yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {filteredUsers.map(user => {
              const isCurrent = isCurrentUser(user.id)
              return (
                <motion.div
                  key={user.id || user.email}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    className="relative border-0 transition-all hover:shadow-lg"
                    style={{
                      backgroundColor: isCurrent ? '#1A1A1A' : '#141414',
                      border: isCurrent
                        ? '2px solid hsl(var(--primary))'
                        : '1px solid #2A2A2A',
                      boxShadow: isCurrent
                        ? '0 4px 12px hsl(var(--primary) / 0.3)'
                        : 'none',
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-full font-semibold"
                            style={{
                              backgroundColor: 'hsl(var(--primary))',
                              color: 'white',
                            }}
                          >
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <CardTitle className="text-lg text-white">
                              {user.full_name}
                            </CardTitle>
                            <CardDescription className="mt-1 flex items-center gap-1 text-gray-500">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </CardDescription>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isCurrent ? (
                            <div
                              className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                              style={{
                                backgroundColor: 'hsl(var(--primary))',
                                color: 'white',
                              }}
                            >
                              <Star className="h-3 w-3 fill-current" />
                              You
                            </div>
                          ) : null}

                          {canManageStatus && !isCurrent && (
                            <Button
                              size="sm"
                              variant={
                                user.is_active ? 'destructive' : 'default'
                              }
                              style={
                                user.is_active
                                  ? {
                                      backgroundColor: '#ef4444',
                                      color: 'white',
                                    }
                                  : {
                                      backgroundColor: 'hsl(var(--primary))',
                                      color: 'white',
                                    }
                              }
                              disabled={updatingUserId === user.id}
                              onClick={() => toggleActivation(user)}
                            >
                              {updatingUserId === user.id ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : null}
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-2">
                        {user.phone && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Phone:</span>
                            <span className="flex items-center gap-1 text-gray-300">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Role:</span>
                          <span className="flex items-center gap-1 font-medium text-gray-300">
                            <Shield className="h-3 w-3" />
                            {user.global_role || user.role || 'User'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Status:</span>
                          <span className="flex items-center gap-1">
                            {user.is_active ? (
                              <>
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span className="font-medium text-green-500">
                                  Active
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 text-red-500" />
                                <span className="font-medium text-red-500">
                                  Inactive
                                </span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-gray-800 text-gray-300 hover:bg-white/5 hover:text-white"
                          onClick={() => setSelectedUser(user)}
                        >
                          View Details
                        </Button>
                        {isCurrent && (
                          <Button
                            size="sm"
                            className="flex-1"
                            style={{
                              backgroundColor: 'hsl(var(--primary))',
                              color: 'white',
                            }}
                            onClick={() =>
                              router.push('/dashboard/settings?tab=profile')
                            }
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Edit Profile
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedUser(null)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
              onClick={e => e.stopPropagation()}
            >
              <div
                className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#1A1A1A] bg-[#141414] shadow-2xl sm:max-h-[90vh]"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#1A1A1A] p-4 sm:p-6">
                  <h2 className="text-lg font-semibold text-white sm:text-xl">
                    User Details
                  </h2>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-400 transition-colors hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
                  {/* Profile Section */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-bold text-white sm:h-16 sm:w-16 sm:text-2xl"
                      style={{
                        background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)`,
                      }}
                    >
                      {selectedUser.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold text-white sm:text-lg">
                        {selectedUser.full_name}
                      </h3>
                      <p className="truncate text-xs text-gray-400 sm:text-sm">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div className="space-y-1">
                      <p className="text-xs tracking-wide text-gray-500 uppercase">
                        Phone
                      </p>
                      <p className="text-sm text-white">{selectedUser.phone}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs tracking-wide text-gray-500 uppercase">
                        Global Role
                      </p>
                      <span
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-white"
                        style={{
                          backgroundColor: 'hsl(var(--primary) / 0.2)',
                        }}
                      >
                        {selectedUser.global_role}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs tracking-wide text-gray-500 uppercase">
                        Account Status
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${
                          selectedUser.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {selectedUser.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="flex items-center gap-1 text-xs tracking-wide text-gray-500 uppercase">
                        <Calendar className="h-3 w-3" />
                        Joined
                      </p>
                      <p className="text-sm text-white">
                        {new Date(selectedUser.created_at).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Societies Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <p className="text-xs tracking-wide text-gray-500 uppercase">
                        Societies ({selectedUser.user_societies?.length || 0})
                      </p>
                    </div>
                    {selectedUser.user_societies &&
                    selectedUser.user_societies.length > 0 ? (
                      <div className="space-y-2">
                        {selectedUser.user_societies.map(us => (
                          <div
                            key={us.id || `${us.society_id}-${us.role}`}
                            className="rounded-lg border border-[#1A1A1A] bg-[#0F0F0F] p-3"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {us.society?.name ||
                                    societyLookup[us.society_id] ||
                                    'Unknown Society'}
                                </p>
                                {us.society?.city && (
                                  <p className="text-xs text-gray-500">
                                    {us.society.city}
                                  </p>
                                )}
                              </div>
                              <span
                                className={`rounded px-2 py-1 text-xs font-medium ${
                                  us.approval_status === 'approved'
                                    ? 'bg-green-500/20 text-green-400'
                                    : us.approval_status === 'rejected'
                                      ? 'bg-red-500/20 text-red-400'
                                      : 'bg-yellow-500/20 text-yellow-400'
                                }`}
                              >
                                {us.approval_status}
                              </span>
                            </div>

                            {canManageMembership(us.society_id) && us.approval_status !== 'approved' && (
                              <div className="mt-3 flex flex-wrap items-center gap-3">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="bg-green-600 text-white hover:bg-green-500"
                                  disabled={updatingUserId === us.id}
                                  onClick={() => approveMembership(us, selectedUser.id)}
                                >
                                  {updatingUserId === us.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : null}
                                  Approve
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No society memberships
                      </p>
                    )}
                  </div>

                  {canManageStatus && !isCurrentUser(selectedUser.id) && (
                    <div className="flex justify-end pt-2">
                      <Button
                        variant={
                          selectedUser.is_active ? 'destructive' : 'default'
                        }
                        style={
                          selectedUser.is_active
                            ? {
                                backgroundColor: '#ef4444',
                                color: 'white',
                              }
                            : {
                                backgroundColor: 'hsl(var(--primary))',
                                color: 'white',
                              }
                        }
                        disabled={updatingUserId === selectedUser.id}
                        onClick={() => toggleActivation(selectedUser)}
                      >
                        {updatingUserId === selectedUser.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {selectedUser.is_active ? 'Deactivate' : 'Activate'} User
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function UsersPage() {
  return (
    <ProtectedRoute>
      <UsersPageContent />
    </ProtectedRoute>
  )
}
