"""
Test fixtures for the Study Session Manager backend.

This module provides pytest fixtures for:
- In-memory SQLite database for isolated testing
- Test client for API integration tests
- Sample test data (users, sessions)
"""

import uuid
from datetime import date, datetime, timezone, timedelta
import pytest
from sqlalchemy import create_engine, event, String
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.session import Session as StudySession


# =============================================================================
# SQLite UUID Support
# =============================================================================

def adapt_uuid_for_sqlite():
    """
    Modify UUID columns to use String type for SQLite compatibility.
    This allows tests to run with SQLite while production uses PostgreSQL.
    """
    from sqlalchemy import TypeDecorator

    class GUID(TypeDecorator):
        """Platform-independent GUID type that uses String for SQLite."""
        impl = String
        cache_ok = True

        def process_bind_param(self, value, dialect):
            if value is not None:
                return str(value)
            return value

        def process_result_value(self, value, dialect):
            if value is not None:
                return uuid.UUID(value)
            return value

    # Replace PostgresUUID with our GUID in the models
    for table in Base.metadata.tables.values():
        for column in table.columns:
            if isinstance(column.type, PostgresUUID):
                column.type = GUID(36)


# =============================================================================
# Database Fixtures
# =============================================================================

@pytest.fixture(scope="function")
def test_engine():
    """Create an in-memory SQLite database engine for testing."""
    # Adapt UUID columns for SQLite
    adapt_uuid_for_sqlite()

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(test_engine):
    """Create a new database session for each test."""
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture(scope="function")
def client(test_engine, db_session):
    """Create a test client with the test database."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# =============================================================================
# Test Data Fixtures
# =============================================================================

@pytest.fixture
def sample_user_id():
    """Generate a sample UUID for testing."""
    return uuid.uuid4()


@pytest.fixture
def sample_user(db_session):
    """Create a sample user in the test database."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def another_user(db_session):
    """Create another sample user for testing."""
    user = User(
        id=uuid.uuid4(),
        email="another@example.com",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def sample_session(db_session, sample_user):
    """Create a sample study session in the test database."""
    session = StudySession(
        id=uuid.uuid4(),
        user_id=sample_user.id,
        subject="Mathematics",
        duration_minutes=60,
        notes="Studied algebra",
        session_date=date.today(),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)
    return session


@pytest.fixture
def multiple_sessions(db_session, sample_user):
    """Create multiple study sessions for testing statistics."""
    sessions = []
    subjects = ["Mathematics", "Physics", "Chemistry", "Mathematics", "Physics"]
    durations = [60, 45, 30, 90, 60]

    for i, (subject, duration) in enumerate(zip(subjects, durations)):
        session = StudySession(
            id=uuid.uuid4(),
            user_id=sample_user.id,
            subject=subject,
            duration_minutes=duration,
            notes=f"Session {i + 1}",
            session_date=date.today() - timedelta(days=i),
            created_at=datetime.now(timezone.utc) - timedelta(days=i),
            updated_at=datetime.now(timezone.utc) - timedelta(days=i),
        )
        sessions.append(session)
        db_session.add(session)

    db_session.commit()
    for session in sessions:
        db_session.refresh(session)

    return sessions


@pytest.fixture
def sessions_with_streak(db_session, sample_user):
    """Create sessions with a study streak (consecutive days)."""
    sessions = []
    today = date.today()

    # Create sessions for the last 5 consecutive days
    for i in range(5):
        session = StudySession(
            id=uuid.uuid4(),
            user_id=sample_user.id,
            subject="Mathematics",
            duration_minutes=60,
            notes=f"Day {i + 1}",
            session_date=today - timedelta(days=i),
            created_at=datetime.now(timezone.utc) - timedelta(days=i),
            updated_at=datetime.now(timezone.utc) - timedelta(days=i),
        )
        sessions.append(session)
        db_session.add(session)

    db_session.commit()
    return sessions


@pytest.fixture
def sessions_broken_streak(db_session, sample_user):
    """Create sessions with a broken streak (gap in days)."""
    sessions = []
    today = date.today()

    # Today and yesterday
    for i in range(2):
        session = StudySession(
            id=uuid.uuid4(),
            user_id=sample_user.id,
            subject="Mathematics",
            duration_minutes=60,
            session_date=today - timedelta(days=i),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        sessions.append(session)
        db_session.add(session)

    # Skip a day, then add more sessions
    for i in range(3, 6):
        session = StudySession(
            id=uuid.uuid4(),
            user_id=sample_user.id,
            subject="Physics",
            duration_minutes=45,
            session_date=today - timedelta(days=i),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        sessions.append(session)
        db_session.add(session)

    db_session.commit()
    return sessions
