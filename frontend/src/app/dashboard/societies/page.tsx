'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ProtectedRoute } from '@/components/ProtectedRoute'

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

function SocietiesPageContent() {
  const [societies, setSocieties] = useState<Society[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchSocieties()
  }, [])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/societies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create society')
      }

      const newSociety = await response.json()
      setSocieties([newSociety, ...societies])
      setShowAddModal(false)
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
      })
      setSuccess(
        'Society created successfully! It will be visible once approved by a developer.'
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create society')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-green-700/50 bg-green-900/30 px-2 py-1 text-xs font-medium text-green-400">
            <CheckCircle className="h-3 w-3" />
            Approved
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-yellow-700/50 bg-yellow-900/30 px-2 py-1 text-xs font-medium text-yellow-400">
            <Clock className="h-3 w-3" />
            Pending Approval
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-700/50 bg-red-900/30 px-2 py-1 text-xs font-medium text-red-400">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        )
      default:
        return null
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
            <h1 className="text-3xl font-bold text-white">Societies</h1>
            <p className="mt-1 text-gray-500">
              Manage your societies and create new ones
            </p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="gap-2"
            style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}
          >
            <Plus className="h-5 w-5" />
            Add Society
          </Button>
        </div>

        <Card className="mb-6 border-0" style={{ backgroundColor: '#141414' }}>
          <CardContent className="pt-6">
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-white">
              <Building2
                className="h-5 w-5"
                style={{ color: 'hsl(var(--primary))' }}
              />
              About Society Registration
            </h3>
            <p className="text-sm text-gray-400">
              When you create a new society, it will be submitted for approval.
              A developer must review and approve it before it becomes visible
              to all users. You&apos;ll see a &quot;Pending Approval&quot;
              status until it&apos;s approved.
            </p>
          </CardContent>
        </Card>

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

        {societies.length === 0 ? (
          <Card className="border-0" style={{ backgroundColor: '#141414' }}>
            <CardContent className="py-12 text-center">
              <Building2 className="mx-auto mb-4 h-16 w-16 text-gray-600" />
              <h3 className="mb-2 text-xl font-semibold text-white">
                No Societies Found
              </h3>
              <p className="mb-6 text-gray-500">
                Get started by creating your first society
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="gap-2"
                style={{
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'white',
                }}
              >
                <Plus className="h-5 w-5" />
                Add Society
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {societies.map((society, index) => (
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
                    <div className="mb-4 flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-lg"
                        style={{
                          background:
                            'linear-gradient(to bottom right, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))',
                        }}
                      >
                        <Building2
                          className="h-6 w-6"
                          style={{ color: 'hsl(var(--primary))' }}
                        />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-white">
                          {society.name}
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          Created{' '}
                          {new Date(society.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div>{getStatusBadge(society.approval_status)}</div>
                  </CardHeader>

                  <CardContent className="space-y-2 text-sm">
                    {society.city && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {society.city}
                          {society.state && `, ${society.state}`}
                          {society.pincode && ` - ${society.pincode}`}
                        </span>
                      </div>
                    )}
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
                      className="mt-4 border-t pt-4"
                      style={{ borderColor: '#1F1F1F' }}
                    >
                      <p className="text-xs text-gray-500">{society.address}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add Society Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg shadow-xl"
              style={{ backgroundColor: '#141414' }}
            >
              <div className="border-b p-6" style={{ borderColor: '#1F1F1F' }}>
                <h2 className="text-2xl font-bold text-white">
                  Add New Society
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Create a new society. It will need developer approval before
                  being listed.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    Society Name *
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="focus:border-primary border-gray-700 bg-black/40 text-white"
                    placeholder="Enter society name"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    Address *
                  </label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={e =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="focus:ring-primary w-full rounded-lg border border-gray-700 bg-black/40 px-3 py-2 text-white focus:border-transparent focus:ring-2"
                    rows={3}
                    placeholder="Enter full address"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">
                      City
                    </label>
                    <Input
                      type="text"
                      value={formData.city}
                      onChange={e =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="focus:border-primary border-gray-700 bg-black/40 text-white"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">
                      State
                    </label>
                    <Input
                      type="text"
                      value={formData.state}
                      onChange={e =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      className="focus:border-primary border-gray-700 bg-black/40 text-white"
                      placeholder="State"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">
                      Pincode
                    </label>
                    <Input
                      type="text"
                      value={formData.pincode}
                      onChange={e =>
                        setFormData({ ...formData, pincode: e.target.value })
                      }
                      className="focus:border-primary border-gray-700 bg-black/40 text-white"
                      placeholder="Pincode"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    Contact Person
                  </label>
                  <Input
                    type="text"
                    value={formData.contact_person}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        contact_person: e.target.value,
                      })
                    }
                    className="focus:border-primary border-gray-700 bg-black/40 text-white"
                    placeholder="Contact person name"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">
                      Contact Email
                    </label>
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          contact_email: e.target.value,
                        })
                      }
                      className="focus:border-primary border-gray-700 bg-black/40 text-white"
                      placeholder="contact@example.com"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">
                      Contact Phone
                    </label>
                    <Input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          contact_phone: e.target.value,
                        })
                      }
                      className="focus:border-primary border-gray-700 bg-black/40 text-white"
                      placeholder="+1234567890"
                    />
                  </div>
                </div>

                <div
                  className="flex justify-end gap-3 border-t pt-4"
                  style={{ borderColor: '#1F1F1F' }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false)
                      setError(null)
                    }}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    style={{
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'white',
                    }}
                  >
                    Create Society
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function SocietiesPage() {
  return (
    <ProtectedRoute>
      <SocietiesPageContent />
    </ProtectedRoute>
  )
}
