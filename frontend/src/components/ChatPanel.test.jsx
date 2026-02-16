/**
 * Unit tests for ChatPanel component
 *
 * Tests cover:
 * - Initial collapsed state with chat button
 * - Expanding to full chat interface
 * - Message input and sending
 * - Loading state during API call
 * - Error handling
 * - Suggested questions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatPanel from './ChatPanel'
import { UserProvider } from '../context/UserContext'
import { api } from '../services/api'

// Mock scrollIntoView (not implemented in jsdom)
Element.prototype.scrollIntoView = vi.fn()

// Mock the API module
vi.mock('../services/api', () => ({
  api: {
    sendChatMessage: vi.fn(),
  },
}))

// Mock user for context
const mockUser = { id: 'user-123', email: 'test@example.com' }

describe('ChatPanel', () => {
  function renderChatPanel() {
    return render(
      <UserProvider>
        <ChatPanel />
      </UserProvider>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.getItem.mockReturnValue(JSON.stringify(mockUser))
  })

  afterEach(() => {
    cleanup()
  })

  describe('collapsed state', () => {
    it('should show chat button when collapsed', () => {
      renderChatPanel()

      const chatButton = screen.getByRole('button', {
        name: /open chat assistant/i,
      })
      expect(chatButton).toBeInTheDocument()
    })

    it('should not show chat interface when collapsed', () => {
      renderChatPanel()

      expect(screen.queryByText('Study Assistant')).not.toBeInTheDocument()
    })
  })

  describe('expanded state', () => {
    it('should show chat interface when button is clicked', async () => {
      const user = userEvent.setup()
      renderChatPanel()

      const chatButton = screen.getByRole('button', {
        name: /open chat assistant/i,
      })
      await user.click(chatButton)

      expect(screen.getByText('Study Assistant')).toBeInTheDocument()
    })

    it('should show welcome message', async () => {
      const user = userEvent.setup()
      renderChatPanel()

      await user.click(
        screen.getByRole('button', { name: /open chat assistant/i })
      )

      expect(
        screen.getByText("Hi! I'm your study assistant.")
      ).toBeInTheDocument()
    })

    it('should show suggested questions', async () => {
      const user = userEvent.setup()
      renderChatPanel()

      await user.click(
        screen.getByRole('button', { name: /open chat assistant/i })
      )

      expect(
        screen.getByText('"How am I doing with my studies?"')
      ).toBeInTheDocument()
    })

    it('should close when close button is clicked', async () => {
      const user = userEvent.setup()
      renderChatPanel()

      await user.click(
        screen.getByRole('button', { name: /open chat assistant/i })
      )
      expect(screen.getByText('Study Assistant')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /close chat/i }))
      expect(screen.queryByText('Study Assistant')).not.toBeInTheDocument()
    })
  })

  describe('message input', () => {
    it('should have an input field for messages', async () => {
      const user = userEvent.setup()
      renderChatPanel()

      await user.click(
        screen.getByRole('button', { name: /open chat assistant/i })
      )

      expect(
        screen.getByPlaceholderText('Ask about your studies...')
      ).toBeInTheDocument()
    })

    it('should have a send button', async () => {
      const user = userEvent.setup()
      renderChatPanel()

      await user.click(
        screen.getByRole('button', { name: /open chat assistant/i })
      )

      expect(
        screen.getByRole('button', { name: /send message/i })
      ).toBeInTheDocument()
    })

    it('should fill input when suggested question is clicked', async () => {
      const user = userEvent.setup()
      renderChatPanel()

      await user.click(
        screen.getByRole('button', { name: /open chat assistant/i })
      )

      await user.click(screen.getByText('"How am I doing with my studies?"'))

      const input = screen.getByPlaceholderText('Ask about your studies...')
      expect(input.value).toBe('How am I doing with my studies?')
    })
  })

  describe('sending messages', () => {
    it('should send message and display response', async () => {
      const user = userEvent.setup()
      api.sendChatMessage.mockResolvedValue({
        response: "You're doing great! You've studied 10 hours this week.",
        context_used: true,
      })

      renderChatPanel()

      await user.click(
        screen.getByRole('button', { name: /open chat assistant/i })
      )

      const input = screen.getByPlaceholderText('Ask about your studies...')
      await user.type(input, 'How am I doing?')
      await user.click(screen.getByRole('button', { name: /send message/i }))

      // User message should appear
      await waitFor(() => {
        expect(screen.getByText('How am I doing?')).toBeInTheDocument()
      })

      // Assistant response should appear
      await waitFor(() => {
        expect(
          screen.getByText(
            "You're doing great! You've studied 10 hours this week."
          )
        ).toBeInTheDocument()
      })
    })

    it('should call API with correct parameters', async () => {
      const user = userEvent.setup()
      api.sendChatMessage.mockResolvedValue({
        response: 'Test response',
        context_used: true,
      })

      renderChatPanel()

      await user.click(
        screen.getByRole('button', { name: /open chat assistant/i })
      )

      const input = screen.getByPlaceholderText('Ask about your studies...')
      await user.type(input, 'Test message')
      await user.click(screen.getByRole('button', { name: /send message/i }))

      await waitFor(() => {
        expect(api.sendChatMessage).toHaveBeenCalledWith(
          'user-123',
          'Test message',
          []
        )
      })
    })

    it('should clear input after sending', async () => {
      const user = userEvent.setup()
      api.sendChatMessage.mockResolvedValue({
        response: 'Response',
        context_used: true,
      })

      renderChatPanel()

      await user.click(
        screen.getByRole('button', { name: /open chat assistant/i })
      )

      const input = screen.getByPlaceholderText('Ask about your studies...')
      await user.type(input, 'My message')
      await user.click(screen.getByRole('button', { name: /send message/i }))

      expect(input.value).toBe('')
    })

    it('should not send empty messages', async () => {
      const user = userEvent.setup()
      renderChatPanel()

      await user.click(
        screen.getByRole('button', { name: /open chat assistant/i })
      )

      await user.click(screen.getByRole('button', { name: /send message/i }))

      expect(api.sendChatMessage).not.toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('should show loading indicator while waiting for response', async () => {
      const user = userEvent.setup()
      // Make API call slow
      api.sendChatMessage.mockReturnValue(new Promise(() => {}))

      renderChatPanel()

      await user.click(
        screen.getByRole('button', { name: /open chat assistant/i })
      )

      const input = screen.getByPlaceholderText('Ask about your studies...')
      await user.type(input, 'Test')
      await user.click(screen.getByRole('button', { name: /send message/i }))

      // Check for loading dots
      const loadingDots = document.querySelectorAll('.animate-bounce')
      expect(loadingDots.length).toBeGreaterThan(0)
    })

    it('should disable input while loading', async () => {
      const user = userEvent.setup()
      api.sendChatMessage.mockReturnValue(new Promise(() => {}))

      renderChatPanel()

      await user.click(
        screen.getByRole('button', { name: /open chat assistant/i })
      )

      const input = screen.getByPlaceholderText('Ask about your studies...')
      await user.type(input, 'Test')
      await user.click(screen.getByRole('button', { name: /send message/i }))

      expect(input).toBeDisabled()
    })
  })

  describe('error handling', () => {
    it('should display error message on API failure', async () => {
      const user = userEvent.setup()
      api.sendChatMessage.mockRejectedValue(new Error('API Error'))

      renderChatPanel()

      await user.click(
        screen.getByRole('button', { name: /open chat assistant/i })
      )

      const input = screen.getByPlaceholderText('Ask about your studies...')
      await user.type(input, 'Test')
      await user.click(screen.getByRole('button', { name: /send message/i }))

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument()
      })
    })
  })

  describe('conversation history', () => {
    it('should send conversation history with subsequent messages', async () => {
      const user = userEvent.setup()
      api.sendChatMessage
        .mockResolvedValueOnce({ response: 'First response', context_used: true })
        .mockResolvedValueOnce({ response: 'Second response', context_used: true })

      renderChatPanel()

      await user.click(
        screen.getByRole('button', { name: /open chat assistant/i })
      )

      const input = screen.getByPlaceholderText('Ask about your studies...')

      // Send first message
      await user.type(input, 'First message')
      await user.click(screen.getByRole('button', { name: /send message/i }))

      await waitFor(() => {
        expect(screen.getByText('First response')).toBeInTheDocument()
      })

      // Send second message
      await user.type(input, 'Second message')
      await user.click(screen.getByRole('button', { name: /send message/i }))

      await waitFor(() => {
        expect(api.sendChatMessage).toHaveBeenLastCalledWith('user-123', 'Second message', [
          { role: 'user', content: 'First message' },
          { role: 'assistant', content: 'First response' },
        ])
      })
    })
  })
})
