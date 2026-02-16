"""
Unit tests for Pydantic schemas.

Tests cover:
- Validation rules
- Default values
- Field constraints
"""

from datetime import date
import pytest
from pydantic import ValidationError

from app.schemas.session import SessionCreate, SessionUpdate, SessionBase
from app.schemas.user import UserCreate, LoginRequest


class TestSessionCreate:
    """Test SessionCreate schema validation."""

    def test_valid_session(self):
        """Test creating a valid session."""
        session = SessionCreate(
            subject="Mathematics",
            duration_minutes=60,
            notes="Test notes",
            session_date=date.today()
        )

        assert session.subject == "Mathematics"
        assert session.duration_minutes == 60

    def test_minimal_session(self):
        """Test creating session with only required fields."""
        session = SessionCreate(
            subject="Physics",
            duration_minutes=30
        )

        assert session.subject == "Physics"
        assert session.notes is None
        assert session.session_date == date.today()  # Default

    def test_invalid_duration_zero(self):
        """Test that duration_minutes must be > 0."""
        with pytest.raises(ValidationError) as exc_info:
            SessionCreate(
                subject="Test",
                duration_minutes=0
            )

        assert "duration_minutes" in str(exc_info.value)

    def test_invalid_duration_negative(self):
        """Test that negative duration is rejected."""
        with pytest.raises(ValidationError):
            SessionCreate(
                subject="Test",
                duration_minutes=-30
            )

    def test_empty_subject(self):
        """Test that empty subject is rejected."""
        with pytest.raises(ValidationError):
            SessionCreate(
                subject="",
                duration_minutes=30
            )

    def test_subject_too_long(self):
        """Test that subject over 100 chars is rejected."""
        with pytest.raises(ValidationError):
            SessionCreate(
                subject="A" * 101,
                duration_minutes=30
            )

    def test_subject_max_length(self):
        """Test that subject at exactly 100 chars is valid."""
        session = SessionCreate(
            subject="A" * 100,
            duration_minutes=30
        )

        assert len(session.subject) == 100


class TestSessionUpdate:
    """Test SessionUpdate schema validation."""

    def test_partial_update(self):
        """Test that all fields are optional."""
        update = SessionUpdate()

        assert update.subject is None
        assert update.duration_minutes is None
        assert update.notes is None
        assert update.session_date is None

    def test_update_single_field(self):
        """Test updating only one field."""
        update = SessionUpdate(subject="New Subject")

        assert update.subject == "New Subject"
        assert update.duration_minutes is None

    def test_update_all_fields(self):
        """Test updating all fields."""
        update = SessionUpdate(
            subject="Updated Subject",
            duration_minutes=90,
            notes="Updated notes",
            session_date=date.today()
        )

        assert update.subject == "Updated Subject"
        assert update.duration_minutes == 90

    def test_update_invalid_duration(self):
        """Test that invalid duration in update is rejected."""
        with pytest.raises(ValidationError):
            SessionUpdate(duration_minutes=0)

    def test_update_empty_subject(self):
        """Test that empty subject in update is rejected."""
        with pytest.raises(ValidationError):
            SessionUpdate(subject="")


class TestUserCreate:
    """Test UserCreate schema validation."""

    def test_valid_email(self):
        """Test creating user with valid email."""
        user = UserCreate(email="test@example.com")

        assert user.email == "test@example.com"

    def test_email_with_plus(self):
        """Test email with plus sign is valid."""
        user = UserCreate(email="user+tag@example.com")

        assert user.email == "user+tag@example.com"

    def test_email_with_subdomain(self):
        """Test email with subdomain is valid."""
        user = UserCreate(email="user@mail.example.com")

        assert user.email == "user@mail.example.com"

    def test_invalid_email_no_at(self):
        """Test that email without @ is rejected."""
        with pytest.raises(ValidationError):
            UserCreate(email="notanemail")

    def test_invalid_email_no_domain(self):
        """Test that email without domain is rejected."""
        with pytest.raises(ValidationError):
            UserCreate(email="user@")

    def test_empty_email(self):
        """Test that empty email is rejected."""
        with pytest.raises(ValidationError):
            UserCreate(email="")


class TestLoginRequest:
    """Test LoginRequest schema validation."""

    def test_valid_login(self):
        """Test valid login request."""
        login = LoginRequest(email="test@example.com")

        assert login.email == "test@example.com"

    def test_invalid_email(self):
        """Test that invalid email is rejected."""
        with pytest.raises(ValidationError):
            LoginRequest(email="invalid")
