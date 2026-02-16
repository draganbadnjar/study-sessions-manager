/**
 * Unit tests for DashboardPage component
 *
 * Tests cover:
 * - Header rendering with user email
 * - Loading state
 * - Error display
 * - Session list and statistics integration
 * - Add Session flow
 *
 * Note: Complex interactions (Edit, Delete) are covered by:
 * - SessionForm.test.jsx (form UI and validation)
 * - ConfirmDialog.test.jsx (dialog UI and button interactions)
 * - useSessions.test.jsx (CRUD operations and API calls)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardPage from './DashboardPage'
import { UserProvider } from '../context/UserContext'
import { api } from '../services/api'

// Mock the API module
vi.mock('../services/api', () => ({
  api: {
    getUserSessions: vi.fn(),
    getUserStats: vi.fn(),
    createSession: vi.fn(),
    updateSession: vi.fn(),
    deleteSession: vi.fn(),
  },
}))

// Mock user for context
const mockUser = { id: 'user-123', email: 'test@example.com' }

// Mock sessions data
const mockSessions = [
  {
    id: 'session-1',
    subject: 'Mathematics',
    duration_minutes: 60,
    session_date: '2024-01-15',
    notes: 'Studied calculus',
  },
  {
    id: 'session-2',
    subject: 'Physics',
    duration_minutes: 45,
    session_date: '2024-01-14',
    notes: null,
  },
]

// Mock stats data
const mockStats = {
  total_sessions: 2,
  total_hours: 1.75,
  sessions_this_week: 2,
  study_streak: 2,
  sessions_by_subject: [
    { subject: 'Mathematics', total_sessions: 1, total_minutes: 60 },
    { subject: 'Physics', total_sessions: 1, total_minutes: 45 },
  ],
}

describe('DashboardPage', () => {
  // Helper to render with UserProvider and mock user
  function renderDashboard() {
    return render(
      <UserProvider>
        <DashboardPage />
      </UserProvider>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Set up localStorage mock before each test
    window.localStorage.getItem.mockReturnValue(JSON.stringify(mockUser))
    // Default successful API responses
    api.getUserSessions.mockResolvedValue([...mockSessions])
    api.getUserStats.mockResolvedValue({ ...mockStats })
  })

  afterEach(() => {
    cleanup()
  })

  describe('loading state', () => {
    it('should show loading spinner while fetching data', () => {
      // Make the API calls never resolve
      api.getUserSessions.mockReturnValue(new Promise(() => {}))
      api.getUserStats.mockReturnValue(new Promise(() => {}))

      renderDashboard()

      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should hide loading spinner after data loads', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('Your Sessions')).toBeInTheDocument()
      })

      const spinner = document.querySelector('.animate-spin')
      expect(spinner).not.toBeInTheDocument()
    })
  })

  describe('header', () => {
    it('should display the app title', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('Study Session Manager')).toBeInTheDocument()
      })
    })

    it('should display user email', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
      })
    })

    it('should display Sign Out button', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('Sign Out')).toBeInTheDocument()
      })
    })
  })

  describe('error display', () => {
    it('should display error message when API call fails', async () => {
      api.getUserSessions.mockRejectedValue(new Error('Failed to fetch sessions'))

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch sessions')).toBeInTheDocument()
      })
    })
  })

  describe('session list section', () => {
    it('should display "Your Sessions" heading', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('Your Sessions')).toBeInTheDocument()
      })
    })

    it('should display Add Session button', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('Add Session')).toBeInTheDocument()
      })
    })

    // Note: Session display is tested via SessionList.test.jsx
    // The integration is verified by checking "Your Sessions" heading appears after loading
  })

  describe('statistics section', () => {
    it('should display "Statistics" heading', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('Statistics')).toBeInTheDocument()
      })
    })

    it('should display stats from API', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('Total Sessions')).toBeInTheDocument()
      })
    })
  })

  describe('Add Session flow', () => {
    it('should open form when Add Session is clicked', async () => {
      const user = userEvent.setup()
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('Add Session')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Add Session'))

      expect(screen.getByText('Add New Session')).toBeInTheDocument()
    })

    it('should close form when Cancel is clicked', async () => {
      const user = userEvent.setup()
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('Add Session')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Add Session'))
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByText('Add New Session')).not.toBeInTheDocument()
    })

    it('should call createSession when form is submitted', async () => {
      const user = userEvent.setup()
      api.createSession.mockResolvedValue({
        id: 'new-session',
        subject: 'Chemistry',
        duration_minutes: 30,
        session_date: '2024-01-16',
        notes: null,
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('Add Session')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Add Session'))

      await user.type(screen.getByLabelText(/subject/i), 'Chemistry')
      await user.type(screen.getByLabelText(/duration/i), '30')

      await user.click(screen.getByRole('button', { name: 'Create' }))

      await waitFor(() => {
        expect(api.createSession).toHaveBeenCalled()
      })
    })

    it('should display error on create failure', async () => {
      const user = userEvent.setup()
      api.createSession.mockRejectedValue(new Error('Failed to create session'))

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('Add Session')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Add Session'))

      await user.type(screen.getByLabelText(/subject/i), 'Test')
      await user.type(screen.getByLabelText(/duration/i), '30')

      await user.click(screen.getByRole('button', { name: 'Create' }))

      await waitFor(() => {
        expect(screen.getByText('Failed to create session')).toBeInTheDocument()
      })
    })
  })
})
