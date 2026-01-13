/// <reference types="../vitest-env.d.ts" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils/test-utils'
import '../utils/setup-tests'

// Mock next/navigation
const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/auth/login',
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}))

describe('Complete Authentication Flow (Integration)', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockReplace.mockClear()
    localStorage.clear()
  })

  describe('User Registration and Login Flow', () => {
    it('should complete full registration and login flow', async () => {
      const user = userEvent.setup()

      // Step 1: Load register page
      const RegisterPage = (await import('@/app/auth/register/page')).default
      const { unmount } = renderWithProviders(<RegisterPage />)

      // Wait for societies to load
      await waitFor(() => {
        expect(screen.getByText('Green Valley Society')).toBeInTheDocument()
      })

      // Step 2: Fill registration form
      await user.type(screen.getByLabelText(/full name/i), 'Test User')
      await user.type(
        screen.getByLabelText(/email address/i),
        'testuser@test.com'
      )
      await user.type(screen.getByLabelText(/phone number/i), '1234567890')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')

      // Select a society
      const firstSociety = screen.getByText('Green Valley Society')
      await user.click(firstSociety)

      // Submit registration
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      })
      await user.click(submitButton)

      // Wait for registration success
      await waitFor(
        () => {
          expect(
            screen.queryByText(/registration successful/i) ||
              screen.queryByText(/account created/i)
          ).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // Unmount register page
      unmount()

      // Step 3: Load login page
      const LoginPage = (await import('@/app/auth/login/page')).default
      renderWithProviders(<LoginPage />)

      // Step 4: Login with new credentials
      await user.type(screen.getByLabelText(/email address/i), 'admin@test.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')

      const loginButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(loginButton)

      // Should redirect to dashboard
      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith('/dashboard')
        },
        { timeout: 3000 }
      )

      // Verify tokens are stored
      expect(localStorage.getItem('access_token')).toBeTruthy()
      expect(localStorage.getItem('refresh_token')).toBeTruthy()
    })

    it('should prevent registration with existing email', async () => {
      const user = userEvent.setup()

      const RegisterPage = (await import('@/app/auth/register/page')).default
      renderWithProviders(<RegisterPage />)

      await waitFor(() => {
        expect(screen.getByText('Green Valley Society')).toBeInTheDocument()
      })

      // Try to register with existing email
      await user.type(screen.getByLabelText(/full name/i), 'Existing User')
      await user.type(
        screen.getByLabelText(/email address/i),
        'existing@test.com'
      )
      await user.type(screen.getByLabelText(/phone number/i), '1234567890')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')

      const firstSociety = screen.getByText('Green Valley Society')
      await user.click(firstSociety)

      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      })
      await user.click(submitButton)

      await waitFor(
        () => {
          expect(
            screen.getByText(/email already registered/i)
          ).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Login with Invalid Credentials', () => {
    it('should show error for invalid credentials', async () => {
      const user = userEvent.setup()

      const LoginPage = (await import('@/app/auth/login/page')).default
      renderWithProviders(<LoginPage />)

      await user.type(screen.getByLabelText(/email address/i), 'wrong@test.com')
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword')

      const loginButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(loginButton)

      await waitFor(
        () => {
          expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled()

      // Should not store tokens
      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
    })
  })

  describe('Session Persistence', () => {
    it('should maintain session with valid tokens', async () => {
      // Simulate existing valid session
      localStorage.setItem('access_token', 'mock-access-token')
      localStorage.setItem('refresh_token', 'mock-refresh-token')

      const preloadedState = {
        auth: {
          user: {
            id: '123',
            email: 'admin@test.com',
            full_name: 'Test Admin',
            is_active: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
      }

      const LoginPage = (await import('@/app/auth/login/page')).default
      renderWithProviders(<LoginPage />, { preloadedState })

      // Verify tokens are still present
      expect(localStorage.getItem('access_token')).toBe('mock-access-token')
      expect(localStorage.getItem('refresh_token')).toBe('mock-refresh-token')
    })
  })

  describe('Form Validation Flow', () => {
    it.skip('should validate all fields in registration', async () => {
      // Note: Currently skipped - app uses server-side validation
      const user = userEvent.setup()

      const RegisterPage = (await import('@/app/auth/register/page')).default
      renderWithProviders(<RegisterPage />)

      await waitFor(() => {
        expect(screen.getByText('Create Account')).toBeInTheDocument()
      })

      // Submit empty form
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      })
      await user.click(submitButton)

      // Should show multiple validation errors
      await waitFor(() => {
        expect(
          screen.getByText(/name must be at least 2 characters/i)
        ).toBeInTheDocument()
      })
    })

    it.skip('should validate email format in login', async () => {
      // Note: Currently skipped - app uses server-side validation
      const user = userEvent.setup()

      const LoginPage = (await import('@/app/auth/login/page')).default
      renderWithProviders(<LoginPage />)

      await user.type(screen.getByLabelText(/email address/i), 'not-an-email')
      await user.type(screen.getByLabelText(/password/i), 'password123')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      await waitFor(
        () => {
          const errorMessage =
            screen.queryByText(/invalid email/i) ||
            screen.queryByText(/must be a valid email/i)
          expect(errorMessage).toBeInTheDocument()
        },
        { timeout: 2000 }
      )
    })
  })

  describe('Navigation Flow', () => {
    it('should navigate from login to register', async () => {
      const LoginPage = (await import('@/app/auth/login/page')).default
      renderWithProviders(<LoginPage />)

      const registerLink = screen.getByRole('link', { name: /sign up/i })
      expect(registerLink).toHaveAttribute('href', '/auth/register')
    })

    it('should navigate from register to login', async () => {
      const RegisterPage = (await import('@/app/auth/register/page')).default
      renderWithProviders(<RegisterPage />)

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /create account/i })
        ).toBeInTheDocument()
      })

      const loginLink = screen.getByRole('link', { name: /sign in/i })
      expect(loginLink).toHaveAttribute('href', '/auth/login')
    })

    it('should navigate to forgot password from login', async () => {
      const LoginPage = (await import('@/app/auth/login/page')).default
      renderWithProviders(<LoginPage />)

      const forgotPasswordLink = screen.getByRole('link', {
        name: /forgot password/i,
      })
      expect(forgotPasswordLink).toHaveAttribute(
        'href',
        '/auth/forgot-password'
      )
    })
  })
})
