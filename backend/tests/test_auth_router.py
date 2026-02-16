"""
Integration tests for Auth Router.

Tests cover:
- Login endpoint
- Registration endpoint
- Error handling (404, 409)
"""

import pytest


class TestAuthLogin:
    """Test POST /auth/login endpoint."""

    def test_login_success(self, client, sample_user):
        """Test successful login with existing user."""
        response = client.post(
            "/auth/login",
            json={"email": sample_user.email}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == sample_user.email
        assert "id" in data

    def test_login_user_not_found(self, client):
        """Test login with nonexistent user returns 404."""
        response = client.post(
            "/auth/login",
            json={"email": "nonexistent@example.com"}
        )

        assert response.status_code == 404
        assert "User not found" in response.json()["detail"]

    def test_login_invalid_email_format(self, client):
        """Test login with invalid email format returns 422."""
        response = client.post(
            "/auth/login",
            json={"email": "not-an-email"}
        )

        assert response.status_code == 422

    def test_login_empty_email(self, client):
        """Test login with empty email returns 422."""
        response = client.post(
            "/auth/login",
            json={"email": ""}
        )

        assert response.status_code == 422

    def test_login_missing_email(self, client):
        """Test login without email field returns 422."""
        response = client.post(
            "/auth/login",
            json={}
        )

        assert response.status_code == 422


class TestAuthRegister:
    """Test POST /auth/register endpoint."""

    def test_register_success(self, client):
        """Test successful registration of new user."""
        response = client.post(
            "/auth/register",
            json={"email": "newuser@example.com"}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert "id" in data

    def test_register_duplicate_email(self, client, sample_user):
        """Test registration with existing email returns 409."""
        response = client.post(
            "/auth/register",
            json={"email": sample_user.email}
        )

        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]

    def test_register_invalid_email_format(self, client):
        """Test registration with invalid email returns 422."""
        response = client.post(
            "/auth/register",
            json={"email": "invalid-email"}
        )

        assert response.status_code == 422

    def test_register_empty_email(self, client):
        """Test registration with empty email returns 422."""
        response = client.post(
            "/auth/register",
            json={"email": ""}
        )

        assert response.status_code == 422

    def test_register_then_login(self, client):
        """Test that a registered user can immediately login."""
        email = "register_then_login@example.com"

        # Register
        register_response = client.post(
            "/auth/register",
            json={"email": email}
        )
        assert register_response.status_code == 201

        # Login
        login_response = client.post(
            "/auth/login",
            json={"email": email}
        )
        assert login_response.status_code == 200
        assert login_response.json()["email"] == email


class TestAuthEdgeCases:
    """Test edge cases for auth endpoints."""

    def test_register_email_with_plus(self, client):
        """Test registration with email containing plus sign."""
        response = client.post(
            "/auth/register",
            json={"email": "user+tag@example.com"}
        )

        assert response.status_code == 201
        assert response.json()["email"] == "user+tag@example.com"

    def test_register_email_with_dots(self, client):
        """Test registration with email containing multiple dots."""
        response = client.post(
            "/auth/register",
            json={"email": "user.name.test@example.com"}
        )

        assert response.status_code == 201

    def test_login_response_contains_timestamps(self, client, sample_user):
        """Test login response includes created_at and updated_at."""
        response = client.post(
            "/auth/login",
            json={"email": sample_user.email}
        )

        assert response.status_code == 200
        data = response.json()
        assert "created_at" in data
        assert "updated_at" in data
