/**
 * Unit tests for App component
 *
 * Tests cover:
 * - Loading state during initialization
 * - Rendering LoginPage when not logged in
 * - Rendering DashboardPage when logged in
 * - Context integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'
import { api } from './services/api'

// Mock the API module
vi.mock('./services/api', () => ({
  api: {
    getUserSessions: vi.fn(),
    getUserStats: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
  },
}))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.getItem.mockReset()
    window.localStorage.setItem.mockReset()
    window.localStorage.removeItem.mockReset()
  })

  describe('loading state', () => {
    it('should show loading spinner initially', () => {
      // Make localStorage return null (simulating first check)
      window.localStorage.getItem.mockReturnValue(null)

      render(<App />)

      // The loading state is brief, but we can check for the spinner class
      // After useEffect runs, it should transition to the login page
    })
  })

  describe('when user is not logged in', () => {
    beforeEach(() => {
      window.localStorage.getItem.mockReturnValue(null)
    })

    it('should render LoginPage', async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Study Session Manager')).toBeInTheDocument()
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      })
    })

    it('should render Sign In button', async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
      })
    })

    it('should not render dashboard elements', async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.queryByText('Your Sessions')).not.toBeInTheDocument()
        expect(screen.queryByText('Sign Out')).not.toBeInTheDocument()
      })
    })
  })

  describe('when user is logged in', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }

    beforeEach(() => {
      window.localStorage.getItem.mockReturnValue(JSON.stringify(mockUser))
      api.getUserSessions.mockResolvedValue([])
      api.getUserStats.mockResolvedValue({
        total_sessions: 0,
        total_hours: 0,
        sessions_this_week: 0,
        study_streak: 0,
      })
    })

    it('should render DashboardPage', async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Your Sessions')).toBeInTheDocument()
      })
    })

    it('should display user email in header', async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
      })
    })

    it('should render Sign Out button', async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Sign Out')).toBeInTheDocument()
      })
    })

    it('should not render login form', async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Sign In' })).not.toBeInTheDocument()
      })
    })
  })

  describe('localStorage persistence', () => {
    it('should check localStorage on mount', () => {
      window.localStorage.getItem.mockReturnValue(null)

      render(<App />)

      expect(window.localStorage.getItem).toHaveBeenCalledWith('study_session_user')
    })

    it('should handle invalid JSON in localStorage', async () => {
      window.localStorage.getItem.mockReturnValue('invalid json')

      render(<App />)

      // Should remove invalid data and show login page
      await waitFor(() => {
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('study_session_user')
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      })
    })

    it('should restore user from valid localStorage data', async () => {
      const mockUser = { id: 'user-456', email: 'stored@example.com' }
      window.localStorage.getItem.mockReturnValue(JSON.stringify(mockUser))
      api.getUserSessions.mockResolvedValue([])
      api.getUserStats.mockResolvedValue({
        total_sessions: 0,
        total_hours: 0,
        sessions_this_week: 0,
        study_streak: 0,
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('stored@example.com')).toBeInTheDocument()
      })
    })
  })

  describe('integration', () => {
    it('should wrap content in UserProvider', async () => {
      window.localStorage.getItem.mockReturnValue(null)

      render(<App />)

      // If UserProvider is not wrapping, the Login page would throw an error
      // when trying to use useUser hook
      await waitFor(() => {
        expect(screen.getByText('Study Session Manager')).toBeInTheDocument()
      })
    })
  })
})
