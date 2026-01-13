const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

export const api = {
  baseURL: API_URL,

  async refreshAccessToken(): Promise<string | null> {
    // If already refreshing, wait for that promise
    if (isRefreshing && refreshPromise) {
      return refreshPromise
    }

    isRefreshing = true
    refreshPromise = (async () => {
      try {
        const refreshToken =
          typeof window !== 'undefined'
            ? localStorage.getItem('refresh_token')
            : null

        if (!refreshToken) {
          return null
        }

        const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })

        if (!response.ok) {
          // Refresh failed, clear tokens
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
          }
          return null
        }

        const data = await response.json()

        // Update access token in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', data.access_token)
        }

        return data.access_token
      } catch (error) {
        console.error('Token refresh error:', error)
        return null
      } finally {
        isRefreshing = false
        refreshPromise = null
      }
    })()

    return refreshPromise
  },

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Check if we're in the browser before accessing localStorage
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('access_token')
        : null

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    }

    let response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    // If 401 Unauthorized, try to refresh token and retry
    if (response.status === 401 && typeof window !== 'undefined') {
      const newToken = await this.refreshAccessToken()

      if (newToken) {
        // Retry the original request with new token
        const retryHeaders: HeadersInit = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...options?.headers,
        }

        response = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers: retryHeaders,
        })
      } else {
        // Refresh failed, redirect to login
        window.location.href = '/auth/login'
        throw new Error('Session expired. Please login again.')
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))

      // Handle 403 Forbidden (insufficient permissions)
      if (response.status === 403) {
        // Redirect to pending approval or dashboard based on the error
        if (
          typeof window !== 'undefined' &&
          error.detail?.includes('permission')
        ) {
          window.location.href = '/dashboard/pending-approval'
        }
        throw new Error(error.detail || 'Insufficient permissions')
      }

      // Handle validation errors
      if (error.detail && Array.isArray(error.detail)) {
        // Pydantic validation errors
        const errorMessages = error.detail
          .map(
            (err: any) =>
              `${err.loc?.join('.')}${err.loc ? ': ' : ''}${err.msg}`
          )
          .join(', ')
        throw new Error(errorMessages)
      }

      throw new Error(error.detail || 'An error occurred')
    }

    return response.json()
  },

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  },

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  },

  patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
}
