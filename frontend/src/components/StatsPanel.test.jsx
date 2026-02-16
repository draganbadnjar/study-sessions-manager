/**
 * Unit tests for StatsPanel component
 *
 * Tests cover:
 * - Rendering with stats data
 * - Rendering empty state (no stats)
 * - Subject breakdown display
 * - Correct formatting of values
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatsPanel from './StatsPanel'

describe('StatsPanel', () => {
  const mockStats = {
    total_sessions: 10,
    total_minutes: 930, // 15h 30min
    sessions_this_week: 4,
    study_streak: 3,
    sessions_by_subject: [
      { subject: 'Mathematics', total_sessions: 5, total_minutes: 300 },
      { subject: 'Physics', total_sessions: 3, total_minutes: 180 },
      { subject: 'Chemistry', total_sessions: 2, total_minutes: 90 },
    ],
  }

  describe('when stats is null', () => {
    it('should show "No statistics available" message', () => {
      render(<StatsPanel stats={null} />)

      expect(screen.getByText('No statistics available')).toBeInTheDocument()
    })
  })

  describe('when stats is provided', () => {
    it('should display total sessions', () => {
      render(<StatsPanel stats={mockStats} />)

      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('Total Sessions')).toBeInTheDocument()
    })

    it('should display total time in user-friendly format', () => {
      render(<StatsPanel stats={mockStats} />)

      expect(screen.getByText('15h 30min')).toBeInTheDocument()
      expect(screen.getByText('Total Time')).toBeInTheDocument()
    })

    it('should display sessions this week', () => {
      render(<StatsPanel stats={mockStats} />)

      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('This Week')).toBeInTheDocument()
    })

    it('should display study streak', () => {
      render(<StatsPanel stats={mockStats} />)

      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('Day Streak')).toBeInTheDocument()
    })

    it('should display "Overview" section header', () => {
      render(<StatsPanel stats={mockStats} />)

      expect(screen.getByText('Overview')).toBeInTheDocument()
    })
  })

  describe('subject breakdown', () => {
    it('should display "By Subject" section when subjects exist', () => {
      render(<StatsPanel stats={mockStats} />)

      expect(screen.getByText('By Subject')).toBeInTheDocument()
    })

    it('should display all subjects', () => {
      render(<StatsPanel stats={mockStats} />)

      expect(screen.getByText('Mathematics')).toBeInTheDocument()
      expect(screen.getByText('Physics')).toBeInTheDocument()
      expect(screen.getByText('Chemistry')).toBeInTheDocument()
    })

    it('should display session count for each subject', () => {
      render(<StatsPanel stats={mockStats} />)

      expect(screen.getByText('5 sessions')).toBeInTheDocument()
      expect(screen.getByText('3 sessions')).toBeInTheDocument()
      expect(screen.getByText('2 sessions')).toBeInTheDocument()
    })

    it('should display time for each subject in user-friendly format', () => {
      render(<StatsPanel stats={mockStats} />)

      // 300 minutes = 5h, 180 = 3h, 90 = 1h 30min
      expect(screen.getByText('(5h)')).toBeInTheDocument()
      expect(screen.getByText('(3h)')).toBeInTheDocument()
      expect(screen.getByText('(1h 30min)')).toBeInTheDocument()
    })

    it('should not display "By Subject" when sessions_by_subject is empty', () => {
      const statsNoSubjects = {
        ...mockStats,
        sessions_by_subject: [],
      }

      render(<StatsPanel stats={statsNoSubjects} />)

      expect(screen.queryByText('By Subject')).not.toBeInTheDocument()
    })

    it('should not display "By Subject" when sessions_by_subject is undefined', () => {
      const statsNoSubjects = {
        total_sessions: 5,
        total_minutes: 600,
        sessions_this_week: 2,
        study_streak: 1,
      }

      render(<StatsPanel stats={statsNoSubjects} />)

      expect(screen.queryByText('By Subject')).not.toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle zero values', () => {
      const zeroStats = {
        total_sessions: 0,
        total_minutes: 0,
        sessions_this_week: 0,
        study_streak: 0,
        sessions_by_subject: [],
      }

      render(<StatsPanel stats={zeroStats} />)

      expect(screen.getByText('0min')).toBeInTheDocument()
      const zeros = screen.getAllByText('0')
      expect(zeros.length).toBeGreaterThanOrEqual(3)
    })

    it('should handle minutes only (less than 1 hour)', () => {
      const minutesOnlyStats = {
        ...mockStats,
        total_minutes: 45,
      }

      render(<StatsPanel stats={minutesOnlyStats} />)

      expect(screen.getByText('45min')).toBeInTheDocument()
    })

    it('should handle exact hours (no remaining minutes)', () => {
      const exactHoursStats = {
        ...mockStats,
        total_minutes: 120,
      }

      render(<StatsPanel stats={exactHoursStats} />)

      expect(screen.getByText('2h')).toBeInTheDocument()
    })

    it('should handle hours and minutes', () => {
      const mixedStats = {
        ...mockStats,
        total_minutes: 110,
      }

      render(<StatsPanel stats={mixedStats} />)

      expect(screen.getByText('1h 50min')).toBeInTheDocument()
    })
  })
})
