/**
 * Unit tests for SessionForm component
 *
 * Tests cover:
 * - Rendering create mode vs edit mode
 * - Form field interactions
 * - Form submission
 * - Cancel functionality
 * - Error display
 * - Loading state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SessionForm from './SessionForm'

describe('SessionForm', () => {
  const defaultProps = {
    session: null,
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    loading: false,
    error: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Create Mode (no session)', () => {
    it('should render "Add New Session" title', () => {
      render(<SessionForm {...defaultProps} />)

      expect(screen.getByText('Add New Session')).toBeInTheDocument()
    })

    it('should render "Create" button', () => {
      render(<SessionForm {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
    })

    it('should have empty form fields', () => {
      render(<SessionForm {...defaultProps} />)

      expect(screen.getByLabelText(/subject/i)).toHaveValue('')
      expect(screen.getByLabelText(/duration/i)).toHaveValue(null)
      expect(screen.getByLabelText(/notes/i)).toHaveValue('')
    })

    it('should set default date to today', () => {
      render(<SessionForm {...defaultProps} />)

      const today = new Date().toISOString().split('T')[0]
      expect(screen.getByLabelText(/date/i)).toHaveValue(today)
    })
  })

  describe('Edit Mode (with session)', () => {
    const existingSession = {
      id: '123',
      subject: 'Mathematics',
      duration_minutes: 60,
      notes: 'Studied algebra',
      session_date: '2024-01-15',
    }

    it('should render "Edit Session" title', () => {
      render(<SessionForm {...defaultProps} session={existingSession} />)

      expect(screen.getByText('Edit Session')).toBeInTheDocument()
    })

    it('should render "Update" button', () => {
      render(<SessionForm {...defaultProps} session={existingSession} />)

      expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument()
    })

    it('should populate form with session data', () => {
      render(<SessionForm {...defaultProps} session={existingSession} />)

      expect(screen.getByLabelText(/subject/i)).toHaveValue('Mathematics')
      expect(screen.getByLabelText(/duration/i)).toHaveValue(60)
      expect(screen.getByLabelText(/notes/i)).toHaveValue('Studied algebra')
      expect(screen.getByLabelText(/date/i)).toHaveValue('2024-01-15')
    })

    it('should handle session without notes', () => {
      const sessionNoNotes = { ...existingSession, notes: null }
      render(<SessionForm {...defaultProps} session={sessionNoNotes} />)

      expect(screen.getByLabelText(/notes/i)).toHaveValue('')
    })
  })

  describe('Form interactions', () => {
    it('should update subject field on input', async () => {
      const user = userEvent.setup()
      render(<SessionForm {...defaultProps} />)

      const subjectInput = screen.getByLabelText(/subject/i)
      await user.type(subjectInput, 'Physics')

      expect(subjectInput).toHaveValue('Physics')
    })

    it('should update duration field on input', async () => {
      const user = userEvent.setup()
      render(<SessionForm {...defaultProps} />)

      const durationInput = screen.getByLabelText(/duration/i)
      await user.type(durationInput, '45')

      expect(durationInput).toHaveValue(45)
    })

    it('should update notes field on input', async () => {
      const user = userEvent.setup()
      render(<SessionForm {...defaultProps} />)

      const notesInput = screen.getByLabelText(/notes/i)
      await user.type(notesInput, 'Test notes')

      expect(notesInput).toHaveValue('Test notes')
    })

    it('should update date field on change', async () => {
      const user = userEvent.setup()
      render(<SessionForm {...defaultProps} />)

      const dateInput = screen.getByLabelText(/date/i)
      await user.clear(dateInput)
      await user.type(dateInput, '2024-02-20')

      expect(dateInput).toHaveValue('2024-02-20')
    })
  })

  describe('Form submission', () => {
    it('should call onSubmit with form data', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<SessionForm {...defaultProps} onSubmit={onSubmit} />)

      // Fill form
      await user.type(screen.getByLabelText(/subject/i), 'Chemistry')
      await user.type(screen.getByLabelText(/duration/i), '30')

      // Submit
      await user.click(screen.getByRole('button', { name: 'Create' }))

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Chemistry',
          duration_minutes: 30,
        })
      )
    })

    it('should convert empty notes to null', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<SessionForm {...defaultProps} onSubmit={onSubmit} />)

      await user.type(screen.getByLabelText(/subject/i), 'Test')
      await user.type(screen.getByLabelText(/duration/i), '15')
      await user.click(screen.getByRole('button', { name: 'Create' }))

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: null,
        })
      )
    })

    it('should include notes when provided', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<SessionForm {...defaultProps} onSubmit={onSubmit} />)

      await user.type(screen.getByLabelText(/subject/i), 'Test')
      await user.type(screen.getByLabelText(/duration/i), '15')
      await user.type(screen.getByLabelText(/notes/i), 'My notes')
      await user.click(screen.getByRole('button', { name: 'Create' }))

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'My notes',
        })
      )
    })
  })

  describe('Cancel button', () => {
    it('should call onCancel when clicked', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()
      render(<SessionForm {...defaultProps} onCancel={onCancel} />)

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(onCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error display', () => {
    it('should display error message when error prop is set', () => {
      render(<SessionForm {...defaultProps} error="Something went wrong" />)

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('should not display error section when error is null', () => {
      render(<SessionForm {...defaultProps} error={null} />)

      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })
  })

  describe('Loading state', () => {
    it('should show "Saving..." when loading', () => {
      render(<SessionForm {...defaultProps} loading={true} />)

      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })

    it('should disable submit button when loading', () => {
      render(<SessionForm {...defaultProps} loading={true} />)

      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
    })

    it('should not disable cancel button when loading', () => {
      render(<SessionForm {...defaultProps} loading={true} />)

      expect(screen.getByRole('button', { name: 'Cancel' })).not.toBeDisabled()
    })
  })

  describe('Form validation', () => {
    it('should have required subject field', () => {
      render(<SessionForm {...defaultProps} />)

      expect(screen.getByLabelText(/subject/i)).toBeRequired()
    })

    it('should have required duration field', () => {
      render(<SessionForm {...defaultProps} />)

      expect(screen.getByLabelText(/duration/i)).toBeRequired()
    })

    it('should have required date field', () => {
      render(<SessionForm {...defaultProps} />)

      expect(screen.getByLabelText(/date/i)).toBeRequired()
    })

    it('should have min=1 on duration field', () => {
      render(<SessionForm {...defaultProps} />)

      expect(screen.getByLabelText(/duration/i)).toHaveAttribute('min', '1')
    })

    it('should have maxLength=100 on subject field', () => {
      render(<SessionForm {...defaultProps} />)

      expect(screen.getByLabelText(/subject/i)).toHaveAttribute(
        'maxLength',
        '100'
      )
    })
  })
})
