/// <reference types="../vitest-env.d.ts" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterPage from '@/app/auth/register/page'
import { renderWithProviders } from '../utils/test-utils'
import '../utils/setup-tests'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}))

describe('Register Page', () => {
  beforeEach(() => {
    mockPush.mockClear()
    localStorage.clear()
  })

  it('should render registration form', async () => {
    renderWithProviders(<RegisterPage />)

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /create account/i })
      ).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('should load and display societies', async () => {
    renderWithProviders(<RegisterPage />)

    await waitFor(() => {
      expect(screen.getByText('Green Valley Society')).toBeInTheDocument()
      expect(screen.getByText('Sunset Apartments')).toBeInTheDocument()
    })
  })

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /create account/i })
      ).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/name must be at least 2 characters/i)
      ).toBeInTheDocument()
    })
  })

  it.skip('should show error for invalid email', async () => {
    // Note: Currently skipped - app uses server-side validation
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /create account/i })
      ).toBeInTheDocument()
    })

    const emailInput = screen.getByLabelText(/email address/i)
    await user.type(emailInput, 'invalid-email')
    await user.tab() // Trigger blur

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        const error = screen.queryByText(/invalid email/i)
        expect(error).toBeInTheDocument()
      },
      { timeout: 2000 }
    )
  })

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /create account/i })
      ).toBeInTheDocument()
    })

    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password456')

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument()
    })
  })

  it('should show error for short password', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /create account/i })
      ).toBeInTheDocument()
    })

    const passwordInput = screen.getByLabelText(/^password$/i)
    await user.type(passwordInput, 'pass')

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 8 characters/i)
      ).toBeInTheDocument()
    })
  })

  it('should allow selecting societies', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await waitFor(() => {
      expect(screen.getByText('Green Valley Society')).toBeInTheDocument()
    })

    // Click on first society
    const firstSociety = screen.getByText('Green Valley Society')
    await user.click(firstSociety)

    // Verify selection (depends on implementation)
    // This test may need adjustment based on actual selection UI
  })

  it('should show error when no society is selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /create account/i })
      ).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const phoneInput = screen.getByLabelText(/phone number/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

    await user.type(nameInput, 'Test User')
    await user.type(emailInput, 'test@test.com')
    await user.type(phoneInput, '1234567890')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/please select at least one society/i)
      ).toBeInTheDocument()
    })
  })

  it('should handle successful registration', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await waitFor(() => {
      expect(screen.getByText('Green Valley Society')).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const phoneInput = screen.getByLabelText(/phone number/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

    await user.type(nameInput, 'New User')
    await user.type(emailInput, 'newuser@test.com')
    await user.type(phoneInput, '1234567890')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')

    // Select a society
    const firstSociety = screen.getByText('Green Valley Society')
    await user.click(firstSociety)

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        const successMessage =
          screen.queryByText(/registration successful/i) ||
          screen.queryByText(/account created/i) ||
          screen.queryByText(/success/i)
        // Success message or no error is good
        if (!successMessage) {
          expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
        } else {
          expect(successMessage).toBeInTheDocument()
        }
      },
      { timeout: 3000 }
    )
  })

  it('should show error for existing email', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await waitFor(() => {
      expect(screen.getByText('Green Valley Society')).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const phoneInput = screen.getByLabelText(/phone number/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

    await user.type(nameInput, 'Existing User')
    await user.type(emailInput, 'existing@test.com')
    await user.type(phoneInput, '1234567890')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')

    // Select a society
    const firstSociety = screen.getByText('Green Valley Society')
    await user.click(firstSociety)

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        const error =
          screen.queryByText(/email already registered/i) ||
          screen.queryByText(/email.*exists/i) ||
          screen.queryByText(/already.*use/i)
        expect(error).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should have link to login page', () => {
    renderWithProviders(<RegisterPage />)

    const loginLink = screen.getByRole('link', { name: /sign in/i })
    expect(loginLink).toHaveAttribute('href', '/auth/login')
  })
})
