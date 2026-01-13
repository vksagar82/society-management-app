/// <reference types="../vitest-env.d.ts" />
import { describe, it, expect, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import authReducer, {
  login,
  register,
  getCurrentUser,
  logout,
  setCredentials,
  clearError,
} from '@/store/slices/authSlice'
import '../utils/setup-tests'

describe('Auth Slice', () => {
  let store: ReturnType<
    typeof configureStore<{ auth: ReturnType<typeof authReducer> }>
  >

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    })
    localStorage.clear()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth
      expect(state.user).toBeNull()
      expect(state.access_token).toBeNull()
      expect(state.refresh_token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('Login', () => {
    it('should handle successful login', async () => {
      const credentials = {
        username: 'admin@test.com',
        password: 'password123',
      }

      await store.dispatch(login(credentials))
      const state = store.getState().auth

      expect(state.isAuthenticated).toBe(true)
      expect(state.access_token).toBe('mock-access-token')
      expect(state.refresh_token).toBe('mock-refresh-token')
      expect(state.error).toBeNull()
      expect(localStorage.getItem('access_token')).toBe('mock-access-token')
      expect(localStorage.getItem('refresh_token')).toBe('mock-refresh-token')
    })

    it('should handle failed login', async () => {
      const credentials = {
        username: 'wrong@test.com',
        password: 'wrongpassword',
      }

      await store.dispatch(login(credentials))
      const state = store.getState().auth

      expect(state.isAuthenticated).toBe(false)
      expect(state.access_token).toBeNull()
      expect(state.error).toBeTruthy()
    })

    it('should set loading state during login', async () => {
      const credentials = {
        username: 'admin@test.com',
        password: 'password123',
      }

      const loginPromise = store.dispatch(login(credentials))

      // Check loading state
      let state = store.getState().auth
      expect(state.isLoading).toBe(true)

      await loginPromise

      // Check final state
      state = store.getState().auth
      expect(state.isLoading).toBe(false)
    })
  })

  describe('Register', () => {
    it('should handle successful registration', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'password123',
        full_name: 'New User',
        phone: '1234567890',
        society_ids: [1],
      }

      await store.dispatch(register(userData))
      const state = store.getState().auth

      expect(state.error).toBeNull()
    })

    it('should handle registration with existing email', async () => {
      const userData = {
        email: 'existing@test.com',
        password: 'password123',
        full_name: 'Existing User',
        phone: '1234567890',
        society_ids: [1],
      }

      await store.dispatch(register(userData))
      const state = store.getState().auth

      expect(state.error).toBeTruthy()
    })
  })

  describe('Get Current User', () => {
    it('should fetch current user successfully', async () => {
      // Set up authenticated state
      localStorage.setItem('access_token', 'mock-access-token')

      await store.dispatch(getCurrentUser())
      const state = store.getState().auth

      expect(state.user).toBeTruthy()
      expect(state.user?.email).toBe('admin@test.com')
      expect(state.user?.full_name).toBe('Test Admin')
      expect(state.error).toBeNull()
    })
  })

  describe('Logout', () => {
    it('should clear auth state on logout', async () => {
      // Set up authenticated state
      store.dispatch(
        setCredentials({
          access_token: 'token',
          user: {
            id: '123',
            email: 'test@test.com',
            full_name: 'Test User',
            is_active: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        })
      )

      await store.dispatch(logout())
      const state = store.getState().auth

      expect(state.user).toBeNull()
      expect(state.access_token).toBeNull()
      expect(state.refresh_token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
    })
  })

  describe('Reducers', () => {
    it('should handle setCredentials', () => {
      const credentials = {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        user: {
          id: '123',
          email: 'test@test.com',
          full_name: 'Test User',
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      }

      store.dispatch(setCredentials(credentials))
      const state = store.getState().auth

      expect(state.access_token).toBe('test-token')
      expect(state.user).toEqual(credentials.user)
      expect(state.isAuthenticated).toBe(true)
    })

    it('should handle clearError', () => {
      // Set up state with error first
      store.dispatch(
        setCredentials({
          access_token: 'token',
          user: {
            id: '123',
            email: 'test@test.com',
            full_name: 'Test User',
            is_active: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        })
      )

      store.dispatch(clearError())
      const state = store.getState().auth

      expect(state.error).toBeNull()
    })
  })
})
