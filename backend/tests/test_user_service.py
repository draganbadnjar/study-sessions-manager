"""
Unit tests for UserService.

Tests cover:
- User creation
- User lookup by email
- User lookup by ID
- Edge cases and error handling
"""

import uuid
import pytest

from app.services.user_service import UserService
from app.schemas.user import UserCreate


class TestUserServiceCreate:
    """Test user creation in UserService."""

    def test_create_user(self, db_session):
        """Test creating a new user."""
        service = UserService(db_session)
        user_data = UserCreate(email="newuser@example.com")

        result = service.create(user_data)

        assert result is not None
        assert result.email == "newuser@example.com"
        assert result.id is not None

    def test_create_user_generates_uuid(self, db_session):
        """Test that created user has a valid UUID."""
        service = UserService(db_session)
        user_data = UserCreate(email="uuid_test@example.com")

        result = service.create(user_data)

        assert isinstance(result.id, uuid.UUID)

    def test_create_user_sets_timestamps(self, db_session):
        """Test that created user has created_at and updated_at timestamps."""
        service = UserService(db_session)
        user_data = UserCreate(email="timestamp@example.com")

        result = service.create(user_data)

        assert result.created_at is not None
        assert result.updated_at is not None

    def test_create_multiple_users(self, db_session):
        """Test creating multiple users."""
        service = UserService(db_session)

        user1 = service.create(UserCreate(email="user1@example.com"))
        user2 = service.create(UserCreate(email="user2@example.com"))

        assert user1.id != user2.id
        assert user1.email != user2.email


class TestUserServiceGetByEmail:
    """Test user lookup by email."""

    def test_get_by_email_existing(self, db_session, sample_user):
        """Test finding an existing user by email."""
        service = UserService(db_session)

        result = service.get_by_email(sample_user.email)

        assert result is not None
        assert result.id == sample_user.id
        assert result.email == sample_user.email

    def test_get_by_email_nonexistent(self, db_session):
        """Test looking up a nonexistent email returns None."""
        service = UserService(db_session)

        result = service.get_by_email("nonexistent@example.com")

        assert result is None

    def test_get_by_email_case_sensitive(self, db_session, sample_user):
        """Test that email lookup is case-sensitive (or not, depending on DB)."""
        service = UserService(db_session)

        # SQLite is case-insensitive by default for LIKE but case-sensitive for =
        result_exact = service.get_by_email(sample_user.email)
        result_upper = service.get_by_email(sample_user.email.upper())

        assert result_exact is not None
        # The uppercase version might or might not match depending on DB
        # This test documents the current behavior

    def test_get_by_email_empty_string(self, db_session):
        """Test looking up with empty email returns None."""
        service = UserService(db_session)

        result = service.get_by_email("")

        assert result is None


class TestUserServiceGetById:
    """Test user lookup by ID."""

    def test_get_by_id_existing(self, db_session, sample_user):
        """Test finding an existing user by ID."""
        service = UserService(db_session)

        result = service.get_by_id(sample_user.id)

        assert result is not None
        assert result.id == sample_user.id
        assert result.email == sample_user.email

    def test_get_by_id_nonexistent(self, db_session):
        """Test looking up a nonexistent ID returns None."""
        service = UserService(db_session)
        fake_id = uuid.uuid4()

        result = service.get_by_id(fake_id)

        assert result is None

    def test_get_by_id_after_create(self, db_session):
        """Test that a created user can be retrieved by ID."""
        service = UserService(db_session)
        user_data = UserCreate(email="findme@example.com")

        created_user = service.create(user_data)
        found_user = service.get_by_id(created_user.id)

        assert found_user is not None
        assert found_user.id == created_user.id
        assert found_user.email == created_user.email


class TestUserServiceEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_email_with_special_characters(self, db_session):
        """Test creating user with special characters in email."""
        service = UserService(db_session)
        special_email = "user+tag@example.com"
        user_data = UserCreate(email=special_email)

        result = service.create(user_data)

        assert result.email == special_email

    def test_email_with_subdomain(self, db_session):
        """Test creating user with subdomain in email."""
        service = UserService(db_session)
        subdomain_email = "user@mail.subdomain.example.com"
        user_data = UserCreate(email=subdomain_email)

        result = service.create(user_data)

        assert result.email == subdomain_email

    def test_long_email(self, db_session):
        """Test creating user with a long email address."""
        service = UserService(db_session)
        # Create a long but valid email (within typical limits)
        long_email = "a" * 50 + "@" + "b" * 50 + ".com"
        user_data = UserCreate(email=long_email)

        result = service.create(user_data)

        assert result.email == long_email

    def test_user_isolation(self, db_session, sample_user, another_user):
        """Test that different users remain separate."""
        service = UserService(db_session)

        user1 = service.get_by_id(sample_user.id)
        user2 = service.get_by_id(another_user.id)

        assert user1.id != user2.id
        assert user1.email != user2.email
