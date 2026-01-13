import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { api } from '@/lib/api'

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  avatar_url?: string
  role?: string
  global_role?: string
  is_active: boolean
  is_approved?: boolean
  created_at: string
  updated_at: string
  user_societies?: Array<{
    id: string
    society_id: string
    society?: {
      name: string
      address?: string
      city?: string
    }
    role: string
    joined_at?: string
    approval_status?: string
  }>
}

interface AuthState {
  user: User | null
  access_token: string | null
  refresh_token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  access_token: null,
  refresh_token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string }) => {
    const response = await fetch(`${api.baseURL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.username,
        password: credentials.password,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      // Handle validation errors (422) and other errors
      if (error.detail) {
        if (Array.isArray(error.detail)) {
          // Pydantic validation errors
          const errorMessages = error.detail
            .map((err: any) => err.msg)
            .join(', ')
          throw new Error(errorMessages)
        } else if (typeof error.detail === 'string') {
          throw new Error(error.detail)
        }
      }
      throw new Error('Login failed')
    }

    const data = await response.json()

    // Store tokens in localStorage
    localStorage.setItem('access_token', data.access_token)
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token)
    }

    return data
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (userData: {
    email: string
    password: string
    full_name: string
    phone: string
    society_ids?: string[]
  }) => {
    const response = await api.post('/api/v1/auth/signup', userData)
    return response
  }
)

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async () => {
    const response = await api.get<User>('/api/v1/users/me')
    return response
  }
)

export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (email: string) => {
    const response = await api.post('/api/v1/auth/forgot-password', { email })
    return response
  }
)

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken =
        typeof window !== 'undefined'
          ? localStorage.getItem('refresh_token')
          : null

      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await fetch(`${api.baseURL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()

      // Update access token in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', data.access_token)
      }

      return data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data: { token: string; new_password: string }) => {
    const response = await api.post('/api/v1/auth/reset-password', data)
    return response
  }
)

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: state => {
      state.user = null
      state.access_token = null
      state.refresh_token = null
      state.isAuthenticated = false
      // Check if we're in browser before accessing localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    },
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; access_token: string }>
    ) => {
      state.user = action.payload.user
      state.access_token = action.payload.access_token
      state.isAuthenticated = true
    },
    restoreSession: state => {
      // Restore session from localStorage on app load
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token')
        if (token) {
          state.access_token = token
          state.isAuthenticated = true
        }
      }
    },
    clearError: state => {
      state.error = null
    },
  },
  extraReducers: builder => {
    builder
      // Login
      .addCase(login.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.access_token = action.payload.access_token
        state.refresh_token = action.payload.refresh_token
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Login failed'
      })
      // Register
      .addCase(register.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, state => {
        state.isLoading = false
        state.error = null
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Registration failed'
      })
      // Get Current User
      .addCase(getCurrentUser.pending, state => {
        state.isLoading = true
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
        state.access_token = null
        state.refresh_token = null
        state.error = action.error.message || 'Failed to fetch user'
        // Clear tokens from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      })
      // Password Reset
      .addCase(requestPasswordReset.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(requestPasswordReset.fulfilled, state => {
        state.isLoading = false
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Password reset request failed'
      })
      // Refresh Token
      .addCase(refreshToken.pending, state => {
        state.isLoading = true
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.isLoading = false
        state.access_token = action.payload.access_token
        state.error = null
      })
      .addCase(refreshToken.rejected, state => {
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
        state.access_token = null
        state.refresh_token = null
        // Clear tokens from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      })
      // Reset Password
      .addCase(resetPassword.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(resetPassword.fulfilled, state => {
        state.isLoading = false
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Password reset failed'
      })
  },
})

export const { logout, setCredentials, restoreSession, clearError } =
  authSlice.actions
export default authSlice.reducer
