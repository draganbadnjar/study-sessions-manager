/**
 * Unit tests for SessionList component
 *
 * Tests cover:
 * - Empty state rendering
 * - Rendering list of sessions
 * - Date and duration formatting
 * - Edit and Delete button functionality
 * - Notes display
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SessionList from './SessionList'

describe('SessionList', () => {
  const mockSessions = [
    {
      id: '1',
      subject: 'Mathematics',
      duration_minutes: 60,
      session_date: '2024-01-15',
      notes: 'Studied algebra',
    },
    {
      id: '2',
      subject: 'Physics',
      duration_minutes: 90,
      session_date: '2024-01-14',
      notes: null,
    },
    {
      id: '3',
      subject: 'Chemistry',
      duration_minutes: 30,
      session_date: '2024-01-13',
      notes: 'Lab work completed',
    },
  ]

  const defaultProps = {
    sessions: mockSessions,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  }

  describe('empty state', () => {
    it('should display empty message when sessions is null', () => {
      render(<SessionList sessions={null} onEdit={vi.fn()} onDelete={vi.fn()} />)

      expect(
        screen.getByText('No study sessions yet. Add your first session!')
      ).toBeInTheDocument()
    })

    it('should display empty message when sessions is empty array', () => {
      render(<SessionList sessions={[]} onEdit={vi.fn()} onDelete={vi.fn()} />)

      expect(
        screen.getByText('No study sessions yet. Add your first session!')
      ).toBeInTheDocument()
    })
  })

  describe('rendering sessions', () => {
    it('should render all sessions', () => {
      render(<SessionList {...defaultProps} />)

      expect(screen.getByText('Mathematics')).toBeInTheDocument()
      expect(screen.getByText('Physics')).toBeInTheDocument()
      expect(screen.getByText('Chemistry')).toBeInTheDocument()
    })

    it('should render Edit button for each session', () => {
      render(<SessionList {...defaultProps} />)

      const editButtons = screen.getAllByText('Edit')
      expect(editButtons).toHaveLength(3)
    })

    it('should render Delete button for each session', () => {
      render(<SessionList {...defaultProps} />)

      const deleteButtons = screen.getAllByText('Delete')
      expect(deleteButtons).toHaveLength(3)
    })
  })

  describe('duration formatting', () => {
    it('should format minutes only (less than 1 hour)', () => {
      const sessions = [
        { id: '1', subject: 'Test', duration_minutes: 45, session_date: '2024-01-15' },
      ]

      render(<SessionList sessions={sessions} onEdit={vi.fn()} onDelete={vi.fn()} />)

      expect(screen.getByText('45m')).toBeInTheDocument()
    })

    it('should format hours only (exact hours)', () => {
      const sessions = [
        { id: '1', subject: 'Test', duration_minutes: 120, session_date: '2024-01-15' },
      ]

      render(<SessionList sessions={sessions} onEdit={vi.fn()} onDelete={vi.fn()} />)

      expect(screen.getByText('2h')).toBeInTheDocument()
    })

    it('should format hours and minutes combined', () => {
      const sessions = [
        { id: '1', subject: 'Test', duration_minutes: 90, session_date: '2024-01-15' },
      ]

      render(<SessionList sessions={sessions} onEdit={vi.fn()} onDelete={vi.fn()} />)

      expect(screen.getByText('1h 30m')).toBeInTheDocument()
    })

    it('should format 1 hour correctly', () => {
      const sessions = [
        { id: '1', subject: 'Test', duration_minutes: 60, session_date: '2024-01-15' },
      ]

      render(<SessionList sessions={sessions} onEdit={vi.fn()} onDelete={vi.fn()} />)

      expect(screen.getByText('1h')).toBeInTheDocument()
    })
  })

  describe('date formatting', () => {
    it('should format date in readable format', () => {
      const sessions = [
        { id: '1', subject: 'Test', duration_minutes: 30, session_date: '2024-01-15' },
      ]

      render(<SessionList sessions={sessions} onEdit={vi.fn()} onDelete={vi.fn()} />)

      // Date format: "Jan 15, 2024"
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument()
    })
  })

  describe('notes display', () => {
    it('should display notes when present', () => {
      render(<SessionList {...defaultProps} />)

      expect(screen.getByText('Studied algebra')).toBeInTheDocument()
      expect(screen.getByText('Lab work completed')).toBeInTheDocument()
    })

    it('should not display notes section when notes is null', () => {
      const sessions = [
        { id: '1', subject: 'Test', duration_minutes: 30, session_date: '2024-01-15', notes: null },
      ]

      render(<SessionList sessions={sessions} onEdit={vi.fn()} onDelete={vi.fn()} />)

      // Only subject, duration, and date should be present
      expect(screen.getByText('Test')).toBeInTheDocument()
      expect(screen.queryByText('null')).not.toBeInTheDocument()
    })
  })

  describe('Edit button', () => {
    it('should call onEdit with session when Edit is clicked', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()

      render(<SessionList {...defaultProps} onEdit={onEdit} />)

      const editButtons = screen.getAllByText('Edit')
      await user.click(editButtons[0])

      expect(onEdit).toHaveBeenCalledTimes(1)
      expect(onEdit).toHaveBeenCalledWith(mockSessions[0])
    })

    it('should call onEdit with correct session for each button', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()

      render(<SessionList {...defaultProps} onEdit={onEdit} />)

      const editButtons = screen.getAllByText('Edit')
      await user.click(editButtons[1])

      expect(onEdit).toHaveBeenCalledWith(mockSessions[1])
    })
  })

  describe('Delete button', () => {
    it('should call onDelete with session when Delete is clicked', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()

      render(<SessionList {...defaultProps} onDelete={onDelete} />)

      const deleteButtons = screen.getAllByText('Delete')
      await user.click(deleteButtons[0])

      expect(onDelete).toHaveBeenCalledTimes(1)
      expect(onDelete).toHaveBeenCalledWith(mockSessions[0])
    })

    it('should call onDelete with correct session for each button', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()

      render(<SessionList {...defaultProps} onDelete={onDelete} />)

      const deleteButtons = screen.getAllByText('Delete')
      await user.click(deleteButtons[2])

      expect(onDelete).toHaveBeenCalledWith(mockSessions[2])
    })
  })

  describe('accessibility', () => {
    it('should render as a list', () => {
      render(<SessionList {...defaultProps} />)

      expect(screen.getByRole('list')).toBeInTheDocument()
    })

    it('should have list items for each session', () => {
      render(<SessionList {...defaultProps} />)

      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(3)
    })
  })
})
