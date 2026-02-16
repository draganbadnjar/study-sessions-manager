/**
 * Unit tests for useSessions hook
 *
 * Tests cover:
 * - Initial data fetching
 * - Loading state
 * - Error handling
 * - createSession function
 * - updateSession function with optimistic updates
 * - deleteSession function with optimistic updates
 * - refresh function
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useSessions } from './useSessions'
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

// Mock user
const mockUser = { id: 'user-123', email: 'test@example.com' }

// Mock sessions
const mockSessions = [
  { id: '1', subject: 'Math', duration_minutes: 60, session_date: '2024-01-15' },
  { id: '2', subject: 'Physics', duration_minutes: 45, session_date: '2024-01-14' },
]

// Mock stats
const mockStats = {
  total_sessions: 2,
  total_hours: 1.75,
  sessions_this_week: 2,
  study_streak: 2,
}

// Wrapper component with UserProvider
function createWrapper() {
  return function Wrapper({ children }) {
    return <UserProvider>{children}</UserProvider>
  }
}

describe('useSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up user in localStorage
    window.localStorage.getItem.mockReturnValue(JSON.stringify(mockUser))
    // Default successful API responses
    api.getUserSessions.mockResolvedValue(mockSessions)
    api.getUserStats.mockResolvedValue(mockStats)
  })

  describe('initial state', () => {
    it('should start with loading true', () => {
      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      expect(result.current.loading).toBe(true)
    })

    it('should start with empty sessions', () => {
      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      expect(result.current.sessions).toEqual([])
    })

    it('should start with null stats', () => {
      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      expect(result.current.stats).toBeNull()
    })

    it('should start with null error', () => {
      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('data fetching', () => {
    it('should fetch sessions and stats on mount', async () => {
      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(api.getUserSessions).toHaveBeenCalledWith('user-123')
      expect(api.getUserStats).toHaveBeenCalledWith('user-123')
    })

    it('should populate sessions after fetch', async () => {
      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.sessions).toEqual(mockSessions)
      })
    })

    it('should populate stats after fetch', async () => {
      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.stats).toEqual(mockStats)
      })
    })

    it('should set loading to false after fetch', async () => {
      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('error handling', () => {
    it('should set error on fetch failure', async () => {
      api.getUserSessions.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.error).toBe('Network error')
      })
    })

    it('should set loading to false on error', async () => {
      api.getUserSessions.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('createSession', () => {
    it('should call api.createSession with user ID and data', async () => {
      const newSession = { subject: 'Chemistry', duration_minutes: 30 }
      const createdSession = { id: '3', ...newSession }
      api.createSession.mockResolvedValue(createdSession)

      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.createSession(newSession)
      })

      expect(api.createSession).toHaveBeenCalledWith('user-123', newSession)
    })

    it('should return created session', async () => {
      const newSession = { subject: 'Chemistry', duration_minutes: 30 }
      const createdSession = { id: '3', ...newSession }
      api.createSession.mockResolvedValue(createdSession)

      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let returnedSession
      await act(async () => {
        returnedSession = await result.current.createSession(newSession)
      })

      expect(returnedSession).toEqual(createdSession)
    })

    it('should refresh data after creating session', async () => {
      const newSession = { subject: 'Chemistry', duration_minutes: 30 }
      api.createSession.mockResolvedValue({ id: '3', ...newSession })

      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Clear the call count
      api.getUserSessions.mockClear()
      api.getUserStats.mockClear()

      await act(async () => {
        await result.current.createSession(newSession)
      })

      expect(api.getUserSessions).toHaveBeenCalled()
      expect(api.getUserStats).toHaveBeenCalled()
    })
  })

  describe('updateSession', () => {
    it('should call api.updateSession with session ID and data', async () => {
      const updateData = { subject: 'Advanced Math' }
      const updatedSession = { ...mockSessions[0], ...updateData }
      api.updateSession.mockResolvedValue(updatedSession)

      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.updateSession('1', updateData)
      })

      expect(api.updateSession).toHaveBeenCalledWith('1', updateData)
    })

    it('should optimistically update session in state', async () => {
      const updateData = { subject: 'Advanced Math' }
      // Make the API call slow
      let resolveUpdate
      api.updateSession.mockReturnValue(
        new Promise((resolve) => {
          resolveUpdate = resolve
        })
      )

      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.updateSession('1', updateData)
      })

      // Should optimistically update
      await waitFor(() => {
        const session = result.current.sessions.find((s) => s.id === '1')
        expect(session.subject).toBe('Advanced Math')
      })

      // Resolve the API call
      resolveUpdate({ ...mockSessions[0], ...updateData })
    })

    it('should rollback on update failure', async () => {
      const updateData = { subject: 'Advanced Math' }
      api.updateSession.mockRejectedValue(new Error('Update failed'))

      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const originalSubject = result.current.sessions[0].subject

      await act(async () => {
        try {
          await result.current.updateSession('1', updateData)
        } catch {
          // Expected to throw
        }
      })

      // Should rollback to original
      expect(result.current.sessions[0].subject).toBe(originalSubject)
    })
  })

  describe('deleteSession', () => {
    it('should call api.deleteSession with session ID', async () => {
      api.deleteSession.mockResolvedValue(null)

      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.deleteSession('1')
      })

      expect(api.deleteSession).toHaveBeenCalledWith('1')
    })

    it('should optimistically remove session from state', async () => {
      let resolveDelete
      api.deleteSession.mockReturnValue(
        new Promise((resolve) => {
          resolveDelete = resolve
        })
      )

      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.sessions).toHaveLength(2)

      act(() => {
        result.current.deleteSession('1')
      })

      // Should optimistically remove
      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(1)
        expect(result.current.sessions.find((s) => s.id === '1')).toBeUndefined()
      })

      // Resolve the API call
      resolveDelete(null)
    })

    it('should rollback on delete failure', async () => {
      api.deleteSession.mockRejectedValue(new Error('Delete failed'))

      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const originalLength = result.current.sessions.length

      await act(async () => {
        try {
          await result.current.deleteSession('1')
        } catch {
          // Expected to throw
        }
      })

      // Should rollback
      expect(result.current.sessions).toHaveLength(originalLength)
    })
  })

  describe('refresh', () => {
    it('should re-fetch sessions and stats', async () => {
      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Clear call counts
      api.getUserSessions.mockClear()
      api.getUserStats.mockClear()

      await act(async () => {
        await result.current.refresh()
      })

      expect(api.getUserSessions).toHaveBeenCalledWith('user-123')
      expect(api.getUserStats).toHaveBeenCalledWith('user-123')
    })
  })

  describe('without user', () => {
    it('should not fetch data when user is null', async () => {
      window.localStorage.getItem.mockReturnValue(null)

      renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      })

      // Wait a bit to ensure no calls are made
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(api.getUserSessions).not.toHaveBeenCalled()
      expect(api.getUserStats).not.toHaveBeenCalled()
    })
  })
})
