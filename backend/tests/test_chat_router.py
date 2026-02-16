"""
Unit tests for Chat Router

Tests cover:
- Chat endpoint with valid user
- Chat endpoint with invalid user
- Chat error handling
"""

import pytest
from unittest.mock import patch, MagicMock
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


class TestChatRouter:
    """Tests for chat endpoint."""

    @patch("app.routers.chat.ChatService")
    @patch("app.routers.chat.UserService")
    def test_chat_success(self, mock_user_service_class, mock_chat_service_class):
        """Test successful chat request."""
        user_id = uuid4()
        mock_user = MagicMock()
        mock_user.id = user_id

        # Mock UserService
        mock_user_service = MagicMock()
        mock_user_service.get_by_id.return_value = mock_user
        mock_user_service_class.return_value = mock_user_service

        # Mock ChatService
        mock_chat_service = MagicMock()
        mock_chat_service.chat.return_value = "Great job! You've studied 10 hours."
        mock_chat_service_class.return_value = mock_chat_service

        response = client.post(
            f"/users/{user_id}/chat",
            json={"message": "How am I doing?", "conversation_history": []},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["response"] == "Great job! You've studied 10 hours."
        assert data["context_used"] is True

    @patch("app.routers.chat.UserService")
    def test_chat_user_not_found(self, mock_user_service_class):
        """Test chat with non-existent user."""
        user_id = uuid4()

        mock_user_service = MagicMock()
        mock_user_service.get_by_id.return_value = None
        mock_user_service_class.return_value = mock_user_service

        response = client.post(
            f"/users/{user_id}/chat",
            json={"message": "How am I doing?"},
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "User not found"

    @patch("app.routers.chat.ChatService")
    @patch("app.routers.chat.UserService")
    def test_chat_api_not_configured(
        self, mock_user_service_class, mock_chat_service_class
    ):
        """Test chat when API key is not configured."""
        user_id = uuid4()
        mock_user = MagicMock()
        mock_user.id = user_id

        mock_user_service = MagicMock()
        mock_user_service.get_by_id.return_value = mock_user
        mock_user_service_class.return_value = mock_user_service

        mock_chat_service = MagicMock()
        mock_chat_service.chat.side_effect = ValueError(
            "Chat feature is not configured."
        )
        mock_chat_service_class.return_value = mock_chat_service

        response = client.post(
            f"/users/{user_id}/chat",
            json={"message": "How am I doing?"},
        )

        assert response.status_code == 503
        assert "not configured" in response.json()["detail"]

    @patch("app.routers.chat.ChatService")
    @patch("app.routers.chat.UserService")
    def test_chat_internal_error(
        self, mock_user_service_class, mock_chat_service_class
    ):
        """Test chat with internal server error."""
        user_id = uuid4()
        mock_user = MagicMock()
        mock_user.id = user_id

        mock_user_service = MagicMock()
        mock_user_service.get_by_id.return_value = mock_user
        mock_user_service_class.return_value = mock_user_service

        mock_chat_service = MagicMock()
        mock_chat_service.chat.side_effect = Exception("API Error")
        mock_chat_service_class.return_value = mock_chat_service

        response = client.post(
            f"/users/{user_id}/chat",
            json={"message": "How am I doing?"},
        )

        assert response.status_code == 500
        assert "try again" in response.json()["detail"]

    def test_chat_invalid_message(self):
        """Test chat with empty message."""
        user_id = uuid4()

        response = client.post(
            f"/users/{user_id}/chat",
            json={"message": ""},
        )

        assert response.status_code == 422  # Validation error

    @patch("app.routers.chat.ChatService")
    @patch("app.routers.chat.UserService")
    def test_chat_with_conversation_history(
        self, mock_user_service_class, mock_chat_service_class
    ):
        """Test chat with conversation history."""
        user_id = uuid4()
        mock_user = MagicMock()
        mock_user.id = user_id

        mock_user_service = MagicMock()
        mock_user_service.get_by_id.return_value = mock_user
        mock_user_service_class.return_value = mock_user_service

        mock_chat_service = MagicMock()
        mock_chat_service.chat.return_value = "Based on our conversation..."
        mock_chat_service_class.return_value = mock_chat_service

        history = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"},
        ]

        response = client.post(
            f"/users/{user_id}/chat",
            json={"message": "Tell me more", "conversation_history": history},
        )

        assert response.status_code == 200
        # Verify chat service was called with history
        mock_chat_service.chat.assert_called_once()
        call_kwargs = mock_chat_service.chat.call_args
        assert call_kwargs[1]["conversation_history"] is not None
