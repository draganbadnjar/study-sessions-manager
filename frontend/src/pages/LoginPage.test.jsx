/**
 * Unit tests for LoginPage component
 *
 * Tests cover:
 * - Initial rendering
 * - Form input handling
 * - Login flow (sign in mode)
 * - Register flow (create account mode)
 * - Mode switching
 * - Error display
 * - Loading state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from './LoginPage'
import { UserProvider } from '../context/UserContext'
import { api } from '../services/api'

// Mock the API module
vi.mock('../services/api', () => ({
  api: {
    login: vi.fn(),
    register: vi.fn(),
  },
}))

// Helper to render with UserProvider
function renderLoginPage() {
  return render(
    <UserProvider>
      <LoginPage />
    </UserProvider>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.getItem.mockReturnValue(null)
  })

  describe('initial rendering', () => {
    it('should render the app title', () => {
      renderLoginPage()

      expect(screen.getByText('Study Session Manager')).toBeInTheDocument()
    })

    it('should render the subtitle', () => {
      renderLoginPage()

      expect(
        screen.getByText('Track your study sessions and boost productivity')
      ).toBeInTheDocument()
    })

    it('should render email input field', () => {
      renderLoginPage()

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    })

    it('should render Sign In button by default', () => {
      renderLoginPage()

      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })

    it('should render Create Account toggle button', () => {
      renderLoginPage()

      expect(
        screen.getByRole('button', { name: 'Create Account' })
      ).toBeInTheDocument()
    })

    it('should show "Don\'t have an account?" text initially', () => {
      renderLoginPage()

      expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
    })
  })

  describe('email input', () => {
    it('should update email value on input', async () => {
      const user = userEvent.setup()
      renderLoginPage()

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'test@example.com')

      expect(emailInput).toHaveValue('test@example.com')
    })

    it('should have email type attribute', () => {
      renderLoginPage()

      const emailInput = screen.getByLabelText(/email address/i)
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('should be required', () => {
      renderLoginPage()

      const emailInput = screen.getByLabelText(/email address/i)
      expect(emailInput).toBeRequired()
    })
  })

  describe('mode switching', () => {
    it('should switch to register mode when Create Account is clicked', async () => {
      const user = userEvent.setup()
      renderLoginPage()

      await user.click(screen.getByRole('button', { name: 'Create Account' }))

      // Submit button should change to "Create Account"
      expect(
        screen.getByRole('button', { name: 'Create Account' })
      ).toBeInTheDocument()
      // Toggle should change to "Sign In Instead"
      expect(
        screen.getByRole('button', { name: 'Sign In Instead' })
      ).toBeInTheDocument()
    })

    it('should show "Already have an account?" in register mode', async () => {
      const user = userEvent.setup()
      renderLoginPage()

      await user.click(screen.getByRole('button', { name: 'Create Account' }))

      expect(screen.getByText('Already have an account?')).toBeInTheDocument()
    })

    it('should switch back to login mode when Sign In Instead is clicked', async () => {
      const user = userEvent.setup()
      renderLoginPage()

      // Switch to register mode
      await user.click(screen.getByRole('button', { name: 'Create Account' }))
      // Switch back to login mode
      await user.click(screen.getByRole('button', { name: 'Sign In Instead' }))

      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })

    it('should clear error when switching modes', async () => {
      const user = userEvent.setup()
      api.login.mockRejectedValueOnce(new Error('User not found'))

      renderLoginPage()

      // Trigger an error
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))

      await waitFor(() => {
        expect(screen.getByText('User not found')).toBeInTheDocument()
      })

      // Switch modes - error should clear
      await user.click(screen.getByRole('button', { name: 'Create Account' }))

      expect(screen.queryByText('User not found')).not.toBeInTheDocument()
    })
  })

  describe('login flow', () => {
    it('should call api.login with email on submit', async () => {
      const user = userEvent.setup()
      api.login.mockResolvedValueOnce({ id: '123', email: 'test@example.com' })

      renderLoginPage()

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))

      expect(api.login).toHaveBeenCalledWith('test@example.com')
    })

    it('should show loading state during login', async () => {
      const user = userEvent.setup()
      // Create a promise that won't resolve immediately
      let resolveLogin
      api.login.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveLogin = resolve
        })
      )

      renderLoginPage()

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))

      expect(screen.getByText('Loading...')).toBeInTheDocument()

      // Resolve the promise
      resolveLogin({ id: '123', email: 'test@example.com' })
    })

    it('should display error message on login failure', async () => {
      const user = userEvent.setup()
      api.login.mockRejectedValueOnce(new Error('User not found'))

      renderLoginPage()

      await user.type(screen.getByLabelText(/email address/i), 'wrong@example.com')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))

      await waitFor(() => {
        expect(screen.getByText('User not found')).toBeInTheDocument()
      })
    })
  })

  describe('register flow', () => {
    it('should call api.register with email in register mode', async () => {
      const user = userEvent.setup()
      api.register.mockResolvedValueOnce({ id: '456', email: 'new@example.com' })

      renderLoginPage()

      // Switch to register mode
      await user.click(screen.getByRole('button', { name: 'Create Account' }))

      await user.type(screen.getByLabelText(/email address/i), 'new@example.com')

      // Find the submit button (first "Create Account" button with type submit)
      const submitButton = screen.getAllByRole('button', { name: 'Create Account' })[0]
      await user.click(submitButton)

      expect(api.register).toHaveBeenCalledWith('new@example.com')
    })

    it('should display error message on registration failure', async () => {
      const user = userEvent.setup()
      api.register.mockRejectedValueOnce(new Error('User already exists'))

      renderLoginPage()

      // Switch to register mode
      await user.click(screen.getByRole('button', { name: 'Create Account' }))

      await user.type(screen.getByLabelText(/email address/i), 'existing@example.com')

      const submitButton = screen.getAllByRole('button', { name: 'Create Account' })[0]
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('User already exists')).toBeInTheDocument()
      })
    })
  })

  describe('loading state', () => {
    it('should disable submit button while loading', async () => {
      const user = userEvent.setup()
      let resolveLogin
      api.login.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveLogin = resolve
        })
      )

      renderLoginPage()

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))

      const loadingButton = screen.getByRole('button', { name: /loading/i })
      expect(loadingButton).toBeDisabled()

      // Clean up
      resolveLogin({ id: '123', email: 'test@example.com' })
    })
  })

  describe('form validation', () => {
    it('should have autocomplete attribute on email input', () => {
      renderLoginPage()

      const emailInput = screen.getByLabelText(/email address/i)
      expect(emailInput).toHaveAttribute('autocomplete', 'email')
    })
  })
})
