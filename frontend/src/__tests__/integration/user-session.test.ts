/// <reference types="../vitest-env.d.ts" />
import { describe, it, expect, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import authReducer, {
  login,
  logout,
  getCurrentUser,
} from '@/store/slices/authSlice'
import '../utils/setup-tests'

describe('User Session Management (Integration)', () => {
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

  it('should handle complete login flow', async () => {
    // Initial state - not authenticated
    let state = store.getState().auth
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()

    // Login
    await store.dispatch(
      login({
        username: 'admin@test.com',
        password: 'password123',
      })
    )

    state = store.getState().auth
    expect(state.isAuthenticated).toBe(true)
    expect(state.access_token).toBe('mock-access-token')
    expect(state.refresh_token).toBe('mock-refresh-token')

    // Fetch user details
    await store.dispatch(getCurrentUser())

    state = store.getState().auth
    expect(state.user).toBeTruthy()
    expect(state.user?.email).toBe('admin@test.com')
    expect(state.user?.full_name).toBe('Test Admin')
  })

  it('should handle logout and clear all data', async () => {
    // Login first
    await store.dispatch(
      login({
        username: 'admin@test.com',
        password: 'password123',
      })
    )

    await store.dispatch(getCurrentUser())

    let state = store.getState().auth
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toBeTruthy()

    // Logout
    await store.dispatch(logout())

    state = store.getState().auth
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.access_token).toBeNull()
    expect(state.refresh_token).toBeNull()
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })

  it('should persist tokens in localStorage', async () => {
    await store.dispatch(
      login({
        username: 'admin@test.com',
        password: 'password123',
      })
    )

    expect(localStorage.getItem('access_token')).toBe('mock-access-token')
    expect(localStorage.getItem('refresh_token')).toBe('mock-refresh-token')
  })

  it('should handle failed login without storing tokens', async () => {
    await store.dispatch(
      login({
        username: 'wrong@test.com',
        password: 'wrongpassword',
      })
    )

    const state = store.getState().auth
    expect(state.isAuthenticated).toBe(false)
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })

  it('should fetch user societies information', async () => {
    await store.dispatch(
      login({
        username: 'admin@test.com',
        password: 'password123',
      })
    )

    await store.dispatch(getCurrentUser())

    const state = store.getState().auth
    expect(state.user?.user_societies).toBeTruthy()
    expect(state.user?.user_societies?.[0]?.society?.name).toBe('Test Society')
  })

  it('should handle unauthorized access', async () => {
    // Try to fetch user without authentication
    localStorage.removeItem('access_token')

    await store.dispatch(getCurrentUser())

    const state = store.getState().auth
    expect(state.error).toBeTruthy()
  })

  it('should handle session expiry and re-login', async () => {
    // First login
    await store.dispatch(
      login({
        username: 'admin@test.com',
        password: 'password123',
      })
    )

    let state = store.getState().auth
    expect(state.isAuthenticated).toBe(true)

    // Simulate session expiry
    await store.dispatch(logout())

    state = store.getState().auth
    expect(state.isAuthenticated).toBe(false)

    // Re-login
    await store.dispatch(
      login({
        username: 'admin@test.com',
        password: 'password123',
      })
    )

    state = store.getState().auth
    expect(state.isAuthenticated).toBe(true)
    expect(state.access_token).toBe('mock-access-token')
  })
})
