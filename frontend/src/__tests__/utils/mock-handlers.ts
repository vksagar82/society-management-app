import { http, HttpResponse } from 'msw'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
// Also support localhost for direct fetch calls
const LOCALHOST_URL = 'http://localhost:8000'

export const handlers = [
  // Login endpoint
  http.post(`${API_URL}/api/v1/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }

    if (body.email === 'admin@test.com' && body.password === 'password123') {
      return HttpResponse.json({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer',
      })
    }

    return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 })
  }),

  // Support localhost for login
  http.post(`${LOCALHOST_URL}/api/v1/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }

    if (body.email === 'admin@test.com' && body.password === 'password123') {
      return HttpResponse.json({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer',
      })
    }

    return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 })
  }),

  // Register/Signup endpoint
  http.post(`${API_URL}/api/v1/auth/signup`, async ({ request }) => {
    const body = (await request.json()) as any

    if (body.email === 'existing@test.com') {
      return HttpResponse.json(
        { detail: 'Email already registered' },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      id: '123',
      email: body.email,
      full_name: body.full_name,
      phone: body.phone,
      is_active: true,
      is_approved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),

  // Support both URLs for signup
  http.post(`${LOCALHOST_URL}/api/v1/auth/signup`, async ({ request }) => {
    const body = (await request.json()) as any

    if (body.email === 'existing@test.com') {
      return HttpResponse.json(
        { detail: 'Email already registered' },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      id: '123',
      email: body.email,
      full_name: body.full_name,
      phone: body.phone,
      is_active: true,
      is_approved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),

  // Get current user endpoint
  http.get(`${API_URL}/api/v1/users/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 })
    }

    return HttpResponse.json({
      id: '123',
      email: 'admin@test.com',
      full_name: 'Test Admin',
      phone: '1234567890',
      role: 'admin',
      global_role: 'admin',
      is_active: true,
      is_approved: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_societies: [
        {
          id: '1',
          society_id: '1',
          society: {
            name: 'Test Society',
            address: '123 Test St',
            city: 'Test City',
          },
          role: 'admin',
          approval_status: 'approved',
        },
      ],
    })
  }),

  // Support localhost URL for users/me
  http.get(`${LOCALHOST_URL}/api/v1/users/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 })
    }

    return HttpResponse.json({
      id: '123',
      email: 'admin@test.com',
      full_name: 'Test Admin',
      phone: '1234567890',
      role: 'admin',
      global_role: 'admin',
      is_active: true,
      is_approved: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_societies: [
        {
          id: '1',
          society_id: '1',
          society: {
            name: 'Test Society',
            address: '123 Test St',
            city: 'Test City',
          },
          role: 'admin',
          approval_status: 'approved',
        },
      ],
    })
  }),

  // Refresh token endpoint
  http.post(`${API_URL}/api/v1/auth/refresh`, async ({ request }) => {
    const body = (await request.json()) as { refresh_token: string }

    if (body.refresh_token === 'mock-refresh-token') {
      return HttpResponse.json({
        access_token: 'new-mock-access-token',
        token_type: 'bearer',
      })
    }

    return HttpResponse.json(
      { detail: 'Invalid refresh token' },
      { status: 401 }
    )
  }),

  // Logout endpoint
  http.post(`${API_URL}/api/v1/auth/logout`, () => {
    return HttpResponse.json({ message: 'Logged out successfully' })
  }),

  // Forgot password endpoint
  http.post(`${API_URL}/api/v1/auth/forgot-password`, async ({ request }) => {
    const body = (await request.json()) as { email: string }

    return HttpResponse.json({
      message: `Password reset email sent to ${body.email}`,
    })
  }),

  // Reset password endpoint
  http.post(`${API_URL}/api/v1/auth/reset-password`, async ({ request }) => {
    const body = (await request.json()) as {
      token: string
      new_password: string
    }

    if (body.token === 'invalid-token') {
      return HttpResponse.json(
        { detail: 'Invalid or expired token' },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      message: 'Password reset successfully',
    })
  }),

  // Get societies (public) - both URLs
  http.get(`${API_URL}/api/v1/societies/public`, () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'Green Valley Society',
        city: 'Mumbai',
        address: '123 Main St',
      },
      {
        id: 2,
        name: 'Sunset Apartments',
        city: 'Pune',
        address: '456 Oak Ave',
      },
    ])
  }),

  http.get(`${LOCALHOST_URL}/api/v1/societies/public`, () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'Green Valley Society',
        city: 'Mumbai',
        address: '123 Main St',
      },
      {
        id: 2,
        name: 'Sunset Apartments',
        city: 'Pune',
        address: '456 Oak Ave',
      },
    ])
  }),

  // Get users
  http.get(`${API_URL}/api/v1/users`, () => {
    return HttpResponse.json([
      {
        id: '1',
        email: 'user1@test.com',
        full_name: 'User One',
        is_active: true,
        is_approved: true,
      },
      {
        id: '2',
        email: 'user2@test.com',
        full_name: 'User Two',
        is_active: true,
        is_approved: false,
      },
    ])
  }),
]
