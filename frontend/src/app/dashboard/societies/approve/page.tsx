'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  XCircle,
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { useAppSelector } from '@/store/hooks'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Society {
  id: string
  name: string
  address: string
  city?: string
  state?: string
  pincode?: string
  contact_person?: string
  contact_email?: string
  contact_phone?: string
  approval_status: 'pending' | 'approved' | 'rejected'
  approved_at?: string
  created_at: string
  updated_at: string
}

export default function ApproveSocietiesPage() {
  const { user } = useAppSelector(state => state.auth)
  const router = useRouter()
  const [societies, setSocieties] = useState<Society[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    // Only developers can access this page
    if (user && user.global_role !== 'developer') {
      router.push('/dashboard')
      return
    }
    fetchSocieties()
  }, [user, router])

  const fetchSocieties = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/societies`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch societies')
      }

      const data = await response.json()
      setSocieties(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load societies')
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (societyId: string, approved: boolean) => {
    setError(null)
    setSuccess(null)
    setProcessingId(societyId)

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/societies/${societyId}/approve-society`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ approved }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to update society')
      }

      setSuccess(
        approved
          ? 'Society approved successfully!'
          : 'Society rejected successfully!'
      )

      // Refresh the list
      await fetchSocieties()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update society')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: '#0A0A0A' }}
      >
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-gray-500">Loading societies...</p>
        </div>
      </div>
    )
  }

  if (user?.global_role !== 'developer') {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: '#0A0A0A' }}
      >
        <Card
          className="max-w-md border-0"
          style={{ backgroundColor: '#141414' }}
        >
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h2 className="mb-2 text-2xl font-bold text-white">
              Access Denied
            </h2>
            <p className="text-gray-400">
              Only developers can approve societies.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pendingSocieties = societies.filter(
    s => s.approval_status === 'pending'
  )
  const approvedSocieties = societies.filter(
    s => s.approval_status === 'approved'
  )

  return (
    <div
      className="space-y-6 p-4 sm:p-6"
      style={{ backgroundColor: '#0A0A0A', minHeight: 'calc(100vh - 4rem)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Society Approvals</h1>
          <p className="mt-1 text-gray-500">
            Review and approve pending society registrations
          </p>
        </div>

        {error && (
          <Card
            className="mb-4 border-0"
            style={{ backgroundColor: '#1F1414' }}
          >
            <CardContent className="pt-6">
              <p className="text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card
            className="mb-4 border-0"
            style={{ backgroundColor: '#141F14' }}
          >
            <CardContent className="pt-6">
              <p className="text-green-400">{success}</p>
            </CardContent>
          </Card>
        )}

        {/* Pending Societies */}
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <Clock className="h-5 w-5 text-yellow-500" />
            Pending Approval ({pendingSocieties.length})
          </h2>

          {pendingSocieties.length === 0 ? (
            <Card className="border-0" style={{ backgroundColor: '#141414' }}>
              <CardContent className="py-8 text-center">
                <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
                <p className="text-gray-400">No pending societies to approve</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {pendingSocieties.map((society, index) => (
                <motion.div
                  key={society.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className="border-2 border-yellow-600/30 transition-all hover:border-yellow-500/50"
                    style={{ backgroundColor: '#141414' }}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-lg"
                          style={{
                            background:
                              'linear-gradient(to bottom right, rgba(234, 179, 8, 0.15), rgba(234, 179, 8, 0.05))',
                          }}
                        >
                          <Building2 className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-white">
                            {society.name}
                          </CardTitle>
                          <p className="mt-1 text-xs text-gray-500">
                            Submitted{' '}
                            {new Date(society.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-start gap-2 text-gray-400">
                        <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <div>
                          <p>{society.address}</p>
                          {(society.city ||
                            society.state ||
                            society.pincode) && (
                            <p>
                              {society.city}
                              {society.state && `, ${society.state}`}
                              {society.pincode && ` - ${society.pincode}`}
                            </p>
                          )}
                        </div>
                      </div>
                      {society.contact_person && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <User className="h-4 w-4" />
                          <span>{society.contact_person}</span>
                        </div>
                      )}
                      {society.contact_phone && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Phone className="h-4 w-4" />
                          <span>{society.contact_phone}</span>
                        </div>
                      )}
                      {society.contact_email && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">
                            {society.contact_email}
                          </span>
                        </div>
                      )}

                      <div
                        className="mt-4 flex gap-3 border-t pt-4"
                        style={{ borderColor: '#1F1F1F' }}
                      >
                        <Button
                          onClick={() => handleApproval(society.id, true)}
                          disabled={processingId === society.id}
                          className="flex-1 gap-2 bg-green-600 text-white hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {processingId === society.id
                            ? 'Processing...'
                            : 'Approve'}
                        </Button>
                        <Button
                          onClick={() => handleApproval(society.id, false)}
                          disabled={processingId === society.id}
                          className="flex-1 gap-2 bg-red-600 text-white hover:bg-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                          {processingId === society.id
                            ? 'Processing...'
                            : 'Reject'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Approved Societies */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Approved Societies ({approvedSocieties.length})
          </h2>

          {approvedSocieties.length === 0 ? (
            <Card className="border-0" style={{ backgroundColor: '#141414' }}>
              <CardContent className="py-8 text-center">
                <Building2 className="mx-auto mb-3 h-12 w-12 text-gray-600" />
                <p className="text-gray-400">No approved societies yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {approvedSocieties.map((society, index) => (
                <motion.div
                  key={society.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className="h-full border-0 transition-all hover:shadow-lg"
                    style={{ backgroundColor: '#141414' }}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-lg"
                          style={{
                            background:
                              'linear-gradient(to bottom right, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))',
                          }}
                        >
                          <Building2 className="h-6 w-6 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-white">
                            {society.name}
                          </CardTitle>
                          <p className="mt-1 text-xs text-gray-500">
                            Approved{' '}
                            {society.approved_at
                              ? new Date(
                                  society.approved_at
                                ).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-1 text-sm">
                      {society.city && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {society.city}
                            {society.state && `, ${society.state}`}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
