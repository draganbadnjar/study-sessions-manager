/**
 * Unit tests for ConfirmDialog component
 *
 * Tests cover:
 * - Rendering with props
 * - Cancel button functionality
 * - Confirm button functionality
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmDialog from './ConfirmDialog'

describe('ConfirmDialog', () => {
  const defaultProps = {
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmLabel: 'Delete',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  it('should render title, message, and buttons', () => {
    render(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByText('Confirm Action')).toBeInTheDocument()
    expect(
      screen.getByText('Are you sure you want to proceed?')
    ).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('should call onCancel when Cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

    await user.click(screen.getByText('Cancel'))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)

    await user.click(screen.getByText('Delete'))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should render with custom confirm label', () => {
    render(<ConfirmDialog {...defaultProps} confirmLabel="Remove Item" />)

    expect(screen.getByText('Remove Item')).toBeInTheDocument()
  })

  it('should render with different title and message', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        title="Delete Session"
        message="This action cannot be undone."
      />
    )

    expect(screen.getByText('Delete Session')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
  })

  it('should have accessible button structure', () => {
    render(<ConfirmDialog {...defaultProps} />)

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    const confirmButton = screen.getByRole('button', { name: 'Delete' })

    expect(cancelButton).toBeInTheDocument()
    expect(confirmButton).toBeInTheDocument()
  })
})
