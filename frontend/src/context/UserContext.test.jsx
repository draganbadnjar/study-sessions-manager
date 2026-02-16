/**
 * Unit tests for UserContext
 *
 * Tests cover:
 * - UserProvider initialization
 * - Login functionality
 * - Logout functionality
 * - localStorage persistence
 * - useUser hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { UserProvider, useUser } from './UserContext'

// Test component that uses the context
function TestConsumer() {
  const { user, login, logout, loading } = useUser()

  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="user">{user ? user.email : 'no user'}</div>
      <button onClick={() => login({ id: '123', email: 'test@example.com' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('UserContext', () => {
  beforeEach(() => {
    // Reset localStorage mock
    window.localStorage.getItem.mockReset()
    window.localStorage.setItem.mockReset()
    window.localStorage.removeItem.mockReset()
  })

  describe('UserProvider', () => {
    it('should render children', () => {
      render(
        <UserProvider>
          <div data-testid="child">Child content</div>
        </UserProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('should start with loading true then false', async () => {
      window.localStorage.getItem.mockReturnValue(null)

      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      )

      // After useEffect runs, loading should be false
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    it('should load user from localStorage on mount', () => {
      const storedUser = { id: '456', email: 'stored@example.com' }
      window.localStorage.getItem.mockReturnValue(JSON.stringify(storedUser))

      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      )

      expect(screen.getByTestId('user')).toHaveTextContent('stored@example.com')
    })

    it('should handle invalid JSON in localStorage', () => {
      window.localStorage.getItem.mockReturnValue('invalid json')

      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      )

      expect(screen.getByTestId('user')).toHaveTextContent('no user')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(
        'study_session_user'
      )
    })

    it('should handle null localStorage value', () => {
      window.localStorage.getItem.mockReturnValue(null)

      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      )

      expect(screen.getByTestId('user')).toHaveTextContent('no user')
    })
  })

  describe('login', () => {
    it('should set user and save to localStorage', async () => {
      window.localStorage.getItem.mockReturnValue(null)

      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      )

      // Initial state
      expect(screen.getByTestId('user')).toHaveTextContent('no user')

      // Click login
      await act(async () => {
        screen.getByText('Login').click()
      })

      // User should be set
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')

      // Should save to localStorage
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'study_session_user',
        JSON.stringify({ id: '123', email: 'test@example.com' })
      )
    })
  })

  describe('logout', () => {
    it('should clear user and remove from localStorage', async () => {
      const storedUser = { id: '789', email: 'logout@example.com' }
      window.localStorage.getItem.mockReturnValue(JSON.stringify(storedUser))

      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      )

      // Initial state with user
      expect(screen.getByTestId('user')).toHaveTextContent('logout@example.com')

      // Click logout
      await act(async () => {
        screen.getByText('Logout').click()
      })

      // User should be cleared
      expect(screen.getByTestId('user')).toHaveTextContent('no user')

      // Should remove from localStorage
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(
        'study_session_user'
      )
    })
  })

  describe('useUser hook', () => {
    it('should throw error when used outside UserProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestConsumer />)
      }).toThrow('useUser must be used within a UserProvider')

      consoleSpy.mockRestore()
    })

    it('should provide user, login, logout, and loading', () => {
      window.localStorage.getItem.mockReturnValue(null)

      let contextValue
      function ContextInspector() {
        contextValue = useUser()
        return null
      }

      render(
        <UserProvider>
          <ContextInspector />
        </UserProvider>
      )

      expect(contextValue).toHaveProperty('user')
      expect(contextValue).toHaveProperty('login')
      expect(contextValue).toHaveProperty('logout')
      expect(contextValue).toHaveProperty('loading')
      expect(typeof contextValue.login).toBe('function')
      expect(typeof contextValue.logout).toBe('function')
    })
  })
})
