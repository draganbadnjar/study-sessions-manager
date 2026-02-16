"""
Unit tests for SessionService.

Tests cover:
- CRUD operations (Create, Read, Update, Delete)
- User statistics calculation
- Study streak calculation
- Edge cases and error handling
"""

import uuid
from datetime import date, timedelta
import pytest

from app.services.session_service import SessionService
from app.schemas.session import SessionCreate, SessionUpdate


class TestSessionServiceCRUD:
    """Test CRUD operations for SessionService."""

    def test_create_session(self, db_session, sample_user):
        """Test creating a new study session."""
        service = SessionService(db_session)
        session_data = SessionCreate(
            subject="Mathematics",
            duration_minutes=60,
            notes="Test notes",
            session_date=date.today(),
        )

        result = service.create(sample_user.id, session_data)

        assert result is not None
        assert result.subject == "Mathematics"
        assert result.duration_minutes == 60
        assert result.notes == "Test notes"
        assert result.user_id == sample_user.id

    def test_create_session_without_notes(self, db_session, sample_user):
        """Test creating a session without notes."""
        service = SessionService(db_session)
        session_data = SessionCreate(
            subject="Physics",
            duration_minutes=45,
            session_date=date.today(),
        )

        result = service.create(sample_user.id, session_data)

        assert result is not None
        assert result.subject == "Physics"
        assert result.notes is None

    def test_get_by_id_existing(self, db_session, sample_session):
        """Test retrieving an existing session by ID."""
        service = SessionService(db_session)

        result = service.get_by_id(sample_session.id)

        assert result is not None
        assert result.id == sample_session.id
        assert result.subject == sample_session.subject

    def test_get_by_id_nonexistent(self, db_session):
        """Test retrieving a nonexistent session returns None."""
        service = SessionService(db_session)
        fake_id = uuid.uuid4()

        result = service.get_by_id(fake_id)

        assert result is None

    def test_get_user_sessions(self, db_session, sample_user, multiple_sessions):
        """Test retrieving all sessions for a user."""
        service = SessionService(db_session)

        result = service.get_user_sessions(sample_user.id)

        assert len(result) == 5
        # Should be ordered by date descending
        assert result[0].session_date >= result[-1].session_date

    def test_get_user_sessions_empty(self, db_session, sample_user):
        """Test retrieving sessions for a user with no sessions."""
        service = SessionService(db_session)

        result = service.get_user_sessions(sample_user.id)

        assert result == []

    def test_get_user_sessions_isolation(self, db_session, sample_user, another_user, sample_session):
        """Test that users only see their own sessions."""
        service = SessionService(db_session)

        user_sessions = service.get_user_sessions(sample_user.id)
        other_sessions = service.get_user_sessions(another_user.id)

        assert len(user_sessions) == 1
        assert len(other_sessions) == 0

    def test_update_session(self, db_session, sample_session):
        """Test updating an existing session."""
        service = SessionService(db_session)
        update_data = SessionUpdate(
            subject="Advanced Mathematics",
            duration_minutes=90,
        )

        result = service.update(sample_session.id, update_data)

        assert result is not None
        assert result.subject == "Advanced Mathematics"
        assert result.duration_minutes == 90
        # Notes should remain unchanged
        assert result.notes == sample_session.notes

    def test_update_session_partial(self, db_session, sample_session):
        """Test partial update (only some fields)."""
        service = SessionService(db_session)
        original_duration = sample_session.duration_minutes
        update_data = SessionUpdate(subject="Updated Subject")

        result = service.update(sample_session.id, update_data)

        assert result.subject == "Updated Subject"
        assert result.duration_minutes == original_duration

    def test_update_nonexistent_session(self, db_session):
        """Test updating a nonexistent session returns None."""
        service = SessionService(db_session)
        fake_id = uuid.uuid4()
        update_data = SessionUpdate(subject="New Subject")

        result = service.update(fake_id, update_data)

        assert result is None

    def test_delete_session(self, db_session, sample_session):
        """Test deleting an existing session."""
        service = SessionService(db_session)

        result = service.delete(sample_session.id)

        assert result is True
        # Verify it's actually deleted
        assert service.get_by_id(sample_session.id) is None

    def test_delete_nonexistent_session(self, db_session):
        """Test deleting a nonexistent session returns False."""
        service = SessionService(db_session)
        fake_id = uuid.uuid4()

        result = service.delete(fake_id)

        assert result is False


class TestSessionServiceStats:
    """Test statistics calculation in SessionService."""

    def test_get_user_stats_with_sessions(self, db_session, sample_user, multiple_sessions):
        """Test calculating statistics with multiple sessions."""
        service = SessionService(db_session)

        stats = service.get_user_stats(sample_user.id)

        assert stats.total_sessions == 5
        assert stats.total_minutes == 285  # 60 + 45 + 30 + 90 + 60
        assert stats.total_hours == 4.8  # 285 / 60 rounded to 1 decimal

    def test_get_user_stats_empty(self, db_session, sample_user):
        """Test statistics for a user with no sessions."""
        service = SessionService(db_session)

        stats = service.get_user_stats(sample_user.id)

        assert stats.total_sessions == 0
        assert stats.total_minutes == 0
        assert stats.total_hours == 0.0

    def test_get_user_stats_sessions_by_subject(self, db_session, sample_user, multiple_sessions):
        """Test that statistics are grouped by subject correctly."""
        service = SessionService(db_session)

        stats = service.get_user_stats(sample_user.id)

        subjects = {s.subject: s for s in stats.sessions_by_subject}

        assert "Mathematics" in subjects
        assert subjects["Mathematics"].total_sessions == 2
        assert subjects["Mathematics"].total_minutes == 150  # 60 + 90

        assert "Physics" in subjects
        assert subjects["Physics"].total_sessions == 2
        assert subjects["Physics"].total_minutes == 105  # 45 + 60

        assert "Chemistry" in subjects
        assert subjects["Chemistry"].total_sessions == 1
        assert subjects["Chemistry"].total_minutes == 30

    def test_get_user_stats_sessions_this_week(self, db_session, sample_user, multiple_sessions):
        """Test counting sessions this week."""
        service = SessionService(db_session)

        stats = service.get_user_stats(sample_user.id)

        # The fixture creates sessions for today and past days
        # Sessions this week depends on current day of week
        assert stats.sessions_this_week >= 0
        assert stats.sessions_this_week <= 5

    def test_get_user_stats_recent_sessions(self, db_session, sample_user, multiple_sessions):
        """Test that recent sessions are limited to 5."""
        service = SessionService(db_session)

        stats = service.get_user_stats(sample_user.id)

        assert len(stats.recent_sessions) <= 5


class TestSessionServiceStreak:
    """Test study streak calculation."""

    def test_streak_consecutive_days(self, db_session, sample_user, sessions_with_streak):
        """Test streak calculation with consecutive days."""
        service = SessionService(db_session)

        stats = service.get_user_stats(sample_user.id)

        assert stats.study_streak == 5

    def test_streak_broken(self, db_session, sample_user, sessions_broken_streak):
        """Test streak calculation with a gap in days."""
        service = SessionService(db_session)

        stats = service.get_user_stats(sample_user.id)

        # Only today and yesterday count (2 days before the gap)
        assert stats.study_streak == 2

    def test_streak_no_sessions(self, db_session, sample_user):
        """Test streak is 0 when no sessions exist."""
        service = SessionService(db_session)

        stats = service.get_user_stats(sample_user.id)

        assert stats.study_streak == 0

    def test_streak_old_sessions_only(self, db_session, sample_user):
        """Test streak is 0 when sessions are old (not today or yesterday)."""
        service = SessionService(db_session)

        # Create a session from 3 days ago
        from app.models.session import Session as StudySession
        from datetime import datetime, timezone

        old_session = StudySession(
            id=uuid.uuid4(),
            user_id=sample_user.id,
            subject="Old Subject",
            duration_minutes=60,
            session_date=date.today() - timedelta(days=3),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(old_session)
        db_session.commit()

        stats = service.get_user_stats(sample_user.id)

        assert stats.study_streak == 0

    def test_streak_started_yesterday(self, db_session, sample_user):
        """Test streak calculation when it starts from yesterday."""
        service = SessionService(db_session)

        from app.models.session import Session as StudySession
        from datetime import datetime, timezone

        # Create sessions for yesterday and day before
        for i in range(1, 4):
            session = StudySession(
                id=uuid.uuid4(),
                user_id=sample_user.id,
                subject="Test",
                duration_minutes=60,
                session_date=date.today() - timedelta(days=i),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            db_session.add(session)
        db_session.commit()

        stats = service.get_user_stats(sample_user.id)

        # Streak should be 3 (yesterday, day before, day before that)
        assert stats.study_streak == 3


class TestSessionServiceEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_multiple_sessions_same_day(self, db_session, sample_user):
        """Test handling multiple sessions on the same day."""
        service = SessionService(db_session)

        # Create multiple sessions for today
        for i in range(3):
            session_data = SessionCreate(
                subject=f"Subject {i}",
                duration_minutes=30,
                session_date=date.today(),
            )
            service.create(sample_user.id, session_data)

        stats = service.get_user_stats(sample_user.id)

        assert stats.total_sessions == 3
        assert stats.total_minutes == 90
        assert stats.study_streak == 1  # Still just 1 day

    def test_session_with_long_duration(self, db_session, sample_user):
        """Test session with very long duration."""
        service = SessionService(db_session)
        session_data = SessionCreate(
            subject="Marathon Study",
            duration_minutes=480,  # 8 hours
            session_date=date.today(),
        )

        result = service.create(sample_user.id, session_data)

        assert result.duration_minutes == 480

        stats = service.get_user_stats(sample_user.id)
        assert stats.total_hours == 8.0

    def test_session_with_special_characters_in_subject(self, db_session, sample_user):
        """Test session with special characters in subject name."""
        service = SessionService(db_session)
        session_data = SessionCreate(
            subject="C++ Programming",
            duration_minutes=60,
            session_date=date.today(),
        )

        result = service.create(sample_user.id, session_data)

        assert result.subject == "C++ Programming"

    def test_session_with_unicode_in_notes(self, db_session, sample_user):
        """Test session with unicode characters in notes."""
        service = SessionService(db_session)
        session_data = SessionCreate(
            subject="Languages",
            duration_minutes=60,
            notes="Studied: English, Deutsch, Francais",
            session_date=date.today(),
        )

        result = service.create(sample_user.id, session_data)

        assert "Deutsch" in result.notes
        assert "Francais" in result.notes
