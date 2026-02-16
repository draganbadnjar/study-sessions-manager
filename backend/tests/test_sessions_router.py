"""
Integration tests for Sessions and Users Router.

Tests cover:
- GET /users/{user_id}/sessions - List user sessions
- POST /users/{user_id}/sessions - Create session
- GET /users/{user_id}/stats - Get user statistics
- PUT /sessions/{session_id} - Update session
- DELETE /sessions/{session_id} - Delete session
"""

import uuid
from datetime import date
import pytest


class TestUserSessions:
    """Test GET /users/{user_id}/sessions endpoint."""

    def test_get_sessions_success(self, client, sample_user, sample_session):
        """Test getting sessions for a user with sessions."""
        response = client.get(f"/users/{sample_user.id}/sessions")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["subject"] == "Mathematics"

    def test_get_sessions_empty(self, client, sample_user):
        """Test getting sessions for a user with no sessions."""
        response = client.get(f"/users/{sample_user.id}/sessions")

        assert response.status_code == 200
        assert response.json() == []

    def test_get_sessions_user_not_found(self, client):
        """Test getting sessions for nonexistent user returns 404."""
        fake_id = uuid.uuid4()
        response = client.get(f"/users/{fake_id}/sessions")

        assert response.status_code == 404
        assert "User not found" in response.json()["detail"]

    def test_get_sessions_multiple(self, client, sample_user, multiple_sessions):
        """Test getting multiple sessions."""
        response = client.get(f"/users/{sample_user.id}/sessions")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5

    def test_get_sessions_ordered_by_date(self, client, sample_user, multiple_sessions):
        """Test that sessions are ordered by date descending."""
        response = client.get(f"/users/{sample_user.id}/sessions")

        data = response.json()
        dates = [item["session_date"] for item in data]
        assert dates == sorted(dates, reverse=True)


class TestCreateSession:
    """Test POST /users/{user_id}/sessions endpoint."""

    def test_create_session_success(self, client, sample_user):
        """Test creating a new session."""
        session_data = {
            "subject": "Physics",
            "duration_minutes": 45,
            "notes": "Studied thermodynamics",
            "session_date": str(date.today())
        }

        response = client.post(
            f"/users/{sample_user.id}/sessions",
            json=session_data
        )

        assert response.status_code == 201
        data = response.json()
        assert data["subject"] == "Physics"
        assert data["duration_minutes"] == 45
        assert data["notes"] == "Studied thermodynamics"

    def test_create_session_minimal(self, client, sample_user):
        """Test creating a session with minimal required fields."""
        session_data = {
            "subject": "Chemistry",
            "duration_minutes": 30
        }

        response = client.post(
            f"/users/{sample_user.id}/sessions",
            json=session_data
        )

        assert response.status_code == 201
        data = response.json()
        assert data["subject"] == "Chemistry"
        assert data["notes"] is None

    def test_create_session_user_not_found(self, client):
        """Test creating session for nonexistent user returns 404."""
        fake_id = uuid.uuid4()
        session_data = {
            "subject": "Test",
            "duration_minutes": 30
        }

        response = client.post(
            f"/users/{fake_id}/sessions",
            json=session_data
        )

        assert response.status_code == 404

    def test_create_session_invalid_duration(self, client, sample_user):
        """Test creating session with invalid duration returns 422."""
        session_data = {
            "subject": "Test",
            "duration_minutes": 0  # Must be > 0
        }

        response = client.post(
            f"/users/{sample_user.id}/sessions",
            json=session_data
        )

        assert response.status_code == 422

    def test_create_session_negative_duration(self, client, sample_user):
        """Test creating session with negative duration returns 422."""
        session_data = {
            "subject": "Test",
            "duration_minutes": -30
        }

        response = client.post(
            f"/users/{sample_user.id}/sessions",
            json=session_data
        )

        assert response.status_code == 422

    def test_create_session_empty_subject(self, client, sample_user):
        """Test creating session with empty subject returns 422."""
        session_data = {
            "subject": "",
            "duration_minutes": 30
        }

        response = client.post(
            f"/users/{sample_user.id}/sessions",
            json=session_data
        )

        assert response.status_code == 422

    def test_create_session_missing_subject(self, client, sample_user):
        """Test creating session without subject returns 422."""
        session_data = {
            "duration_minutes": 30
        }

        response = client.post(
            f"/users/{sample_user.id}/sessions",
            json=session_data
        )

        assert response.status_code == 422


class TestUserStats:
    """Test GET /users/{user_id}/stats endpoint."""

    def test_get_stats_success(self, client, sample_user, multiple_sessions):
        """Test getting statistics for a user."""
        response = client.get(f"/users/{sample_user.id}/stats")

        assert response.status_code == 200
        data = response.json()

        assert data["total_sessions"] == 5
        assert data["total_minutes"] == 285
        assert data["total_hours"] == 4.8
        assert "sessions_by_subject" in data
        assert "recent_sessions" in data

    def test_get_stats_empty(self, client, sample_user):
        """Test getting statistics for user with no sessions."""
        response = client.get(f"/users/{sample_user.id}/stats")

        assert response.status_code == 200
        data = response.json()
        assert data["total_sessions"] == 0
        assert data["total_minutes"] == 0

    def test_get_stats_user_not_found(self, client):
        """Test getting statistics for nonexistent user returns 404."""
        fake_id = uuid.uuid4()
        response = client.get(f"/users/{fake_id}/stats")

        assert response.status_code == 404

    def test_get_stats_subject_breakdown(self, client, sample_user, multiple_sessions):
        """Test that stats include subject breakdown."""
        response = client.get(f"/users/{sample_user.id}/stats")

        data = response.json()
        subjects = {s["subject"]: s for s in data["sessions_by_subject"]}

        assert "Mathematics" in subjects
        assert "Physics" in subjects
        assert "Chemistry" in subjects


class TestUpdateSession:
    """Test PUT /sessions/{session_id} endpoint."""

    def test_update_session_success(self, client, sample_session):
        """Test updating an existing session."""
        update_data = {
            "subject": "Advanced Mathematics",
            "duration_minutes": 90
        }

        response = client.put(
            f"/sessions/{sample_session.id}",
            json=update_data
        )

        assert response.status_code == 200
        data = response.json()
        assert data["subject"] == "Advanced Mathematics"
        assert data["duration_minutes"] == 90

    def test_update_session_partial(self, client, sample_session):
        """Test partial update of a session."""
        update_data = {
            "notes": "Updated notes only"
        }

        response = client.put(
            f"/sessions/{sample_session.id}",
            json=update_data
        )

        assert response.status_code == 200
        data = response.json()
        assert data["notes"] == "Updated notes only"
        assert data["subject"] == sample_session.subject  # Unchanged

    def test_update_session_not_found(self, client):
        """Test updating nonexistent session returns 404."""
        fake_id = uuid.uuid4()
        update_data = {"subject": "New Subject"}

        response = client.put(
            f"/sessions/{fake_id}",
            json=update_data
        )

        assert response.status_code == 404

    def test_update_session_invalid_duration(self, client, sample_session):
        """Test updating session with invalid duration returns 422."""
        update_data = {
            "duration_minutes": 0
        }

        response = client.put(
            f"/sessions/{sample_session.id}",
            json=update_data
        )

        assert response.status_code == 422


class TestDeleteSession:
    """Test DELETE /sessions/{session_id} endpoint."""

    def test_delete_session_success(self, client, sample_session):
        """Test deleting an existing session."""
        response = client.delete(f"/sessions/{sample_session.id}")

        assert response.status_code == 204

    def test_delete_session_not_found(self, client):
        """Test deleting nonexistent session returns 404."""
        fake_id = uuid.uuid4()

        response = client.delete(f"/sessions/{fake_id}")

        assert response.status_code == 404

    def test_delete_session_verify_removed(self, client, sample_user, sample_session):
        """Test that deleted session is no longer in user's sessions."""
        # Delete the session
        delete_response = client.delete(f"/sessions/{sample_session.id}")
        assert delete_response.status_code == 204

        # Verify it's gone
        get_response = client.get(f"/users/{sample_user.id}/sessions")
        assert get_response.status_code == 200
        assert get_response.json() == []


class TestSessionsIntegration:
    """Integration tests combining multiple operations."""

    def test_create_update_delete_flow(self, client, sample_user):
        """Test full CRUD flow for a session."""
        # Create
        create_response = client.post(
            f"/users/{sample_user.id}/sessions",
            json={
                "subject": "Integration Test",
                "duration_minutes": 30
            }
        )
        assert create_response.status_code == 201
        session_id = create_response.json()["id"]

        # Update
        update_response = client.put(
            f"/sessions/{session_id}",
            json={"duration_minutes": 60}
        )
        assert update_response.status_code == 200
        assert update_response.json()["duration_minutes"] == 60

        # Delete
        delete_response = client.delete(f"/sessions/{session_id}")
        assert delete_response.status_code == 204

        # Verify deleted
        sessions_response = client.get(f"/users/{sample_user.id}/sessions")
        assert len(sessions_response.json()) == 0

    def test_stats_update_after_create(self, client, sample_user):
        """Test that stats update after creating sessions."""
        # Initial stats
        initial_stats = client.get(f"/users/{sample_user.id}/stats").json()
        assert initial_stats["total_sessions"] == 0

        # Create a session
        client.post(
            f"/users/{sample_user.id}/sessions",
            json={
                "subject": "Test",
                "duration_minutes": 60
            }
        )

        # Stats should update
        updated_stats = client.get(f"/users/{sample_user.id}/stats").json()
        assert updated_stats["total_sessions"] == 1
        assert updated_stats["total_minutes"] == 60
