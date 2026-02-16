/**
 * Test utilities for React Testing Library
 *
 * Provides custom render functions that wrap components
 * with necessary providers (UserContext, etc.)
 */

import { render } from '@testing-library/react'
import { UserProvider } from '../context/UserContext'

/**
 * Custom render function that wraps components with UserProvider
 */
function renderWithProviders(ui, options = {}) {
  function Wrapper({ children }) {
    return <UserProvider>{children}</UserProvider>
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

// Re-export everything from testing-library
export * from '@testing-library/react'

// Override render with custom render
export { renderWithProviders as render }

/**
 * Mock user data for testing
 */
export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

/**
 * Mock session data for testing
 */
export const mockSession = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  user_id: '123e4567-e89b-12d3-a456-426614174000',
  subject: 'Mathematics',
  duration_minutes: 60,
  notes: 'Studied calculus',
  session_date: '2024-01-15',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
}

/**
 * Mock stats data for testing
 */
export const mockStats = {
  total_sessions: 5,
  total_minutes: 300,
  total_hours: 5.0,
  sessions_this_week: 3,
  study_streak: 2,
  sessions_by_subject: [
    { subject: 'Mathematics', total_sessions: 3, total_minutes: 180 },
    { subject: 'Physics', total_sessions: 2, total_minutes: 120 },
  ],
  recent_sessions: [],
}

/**
 * Helper to create mock fetch response
 */
export function createMockResponse(data, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  })
}

/**
 * Helper to create mock fetch error response
 */
export function createMockErrorResponse(message, status = 400) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ detail: message }),
  })
}
