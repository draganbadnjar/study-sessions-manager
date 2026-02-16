/**
 * Unit tests for API service
 *
 * Tests cover:
 * - Authentication endpoints (login, register)
 * - Session CRUD operations
 * - Stats retrieval
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api, ApiError } from './api'

describe('API Service', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('ApiError', () => {
    it('should create an error with message and status', () => {
      const error = new ApiError('Test error', 404)

      expect(error.message).toBe('Test error')
      expect(error.status).toBe(404)
      expect(error.name).toBe('ApiError')
    })

    it('should be an instance of Error', () => {
      const error = new ApiError('Test error', 500)

      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('login', () => {
    it('should return user data on successful login', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        created_at: '2024-01-01',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockUser),
      })

      const result = await api.login('test@example.com')

      expect(result).toEqual(mockUser)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com' }),
        })
      )
    })

    it('should throw ApiError on 404 (user not found)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'User not found' }),
      })

      await expect(api.login('notfound@example.com')).rejects.toThrow(ApiError)
      await expect(api.login('notfound@example.com')).rejects.toThrow('User not found')
    })

    it('should throw ApiError on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(
        new TypeError('Failed to fetch')
      )

      await expect(api.login('test@example.com')).rejects.toThrow(ApiError)
      await expect(api.login('test@example.com')).rejects.toThrow(
        'Unable to connect to the server'
      )
    })
  })

  describe('register', () => {
    it('should return user data on successful registration', async () => {
      const mockUser = {
        id: '456',
        email: 'new@example.com',
        created_at: '2024-01-01',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockUser),
      })

      const result = await api.register('new@example.com')

      expect(result).toEqual(mockUser)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'new@example.com' }),
        })
      )
    })

    it('should throw ApiError on 409 (duplicate email)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ detail: 'User already exists' }),
      })

      await expect(api.register('existing@example.com')).rejects.toThrow(
        'User already exists'
      )
    })
  })

  describe('getUserSessions', () => {
    it('should return sessions array', async () => {
      const mockSessions = [
        { id: '1', subject: 'Math', duration_minutes: 60 },
        { id: '2', subject: 'Physics', duration_minutes: 45 },
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSessions),
      })

      const result = await api.getUserSessions('user-123')

      expect(result).toEqual(mockSessions)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/sessions'),
        expect.anything()
      )
    })

    it('should throw ApiError on 404', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'User not found' }),
      })

      await expect(api.getUserSessions('invalid-id')).rejects.toThrow(ApiError)
    })
  })

  describe('createSession', () => {
    it('should return created session', async () => {
      const sessionData = {
        subject: 'Chemistry',
        duration_minutes: 30,
        session_date: '2024-01-15',
      }
      const mockSession = { id: '789', ...sessionData }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockSession),
      })

      const result = await api.createSession('user-123', sessionData)

      expect(result).toEqual(mockSession)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/sessions'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(sessionData),
        })
      )
    })
  })

  describe('updateSession', () => {
    it('should return updated session', async () => {
      const updateData = { subject: 'Advanced Math', duration_minutes: 90 }
      const mockUpdated = { id: 'session-1', ...updateData }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockUpdated),
      })

      const result = await api.updateSession('session-1', updateData)

      expect(result).toEqual(mockUpdated)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/session-1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      )
    })

    it('should throw ApiError on 404', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Session not found' }),
      })

      await expect(
        api.updateSession('invalid-id', { subject: 'Test' })
      ).rejects.toThrow('Session not found')
    })
  })

  describe('deleteSession', () => {
    it('should return null on successful deletion', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      })

      const result = await api.deleteSession('session-1')

      expect(result).toBeNull()
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/session-1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('should throw ApiError on 404', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Session not found' }),
      })

      await expect(api.deleteSession('invalid-id')).rejects.toThrow(
        'Session not found'
      )
    })
  })

  describe('getUserStats', () => {
    it('should return stats object', async () => {
      const mockStats = {
        total_sessions: 10,
        total_hours: 15.5,
        study_streak: 3,
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockStats),
      })

      const result = await api.getUserStats('user-123')

      expect(result).toEqual(mockStats)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-123/stats'),
        expect.anything()
      )
    })
  })

  describe('Error handling edge cases', () => {
    it('should handle response with no JSON body', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('No JSON')),
      })

      await expect(api.login('test@example.com')).rejects.toThrow(
        'An error occurred'
      )
    })

    it('should handle generic network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(api.login('test@example.com')).rejects.toThrow(
        'network error occurred'
      )
    })
  })
})
