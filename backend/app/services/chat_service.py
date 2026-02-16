from uuid import UUID
from typing import List, Optional
from sqlalchemy.orm import Session
from anthropic import Anthropic
from app.config import get_settings, logger
from app.services.session_service import SessionService
from app.schemas.chat import ChatMessage


class ChatService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()
        self.session_service = SessionService(db)

    def _build_study_context(self, user_id: UUID) -> str:
        """Build context string from user's study data."""
        logger.info(f"Building study context for user: {user_id}")

        # Get user's sessions and stats
        sessions = self.session_service.get_user_sessions(user_id)
        stats = self.session_service.get_user_stats(user_id)

        if not sessions:
            return "The user has no study sessions recorded yet."

        # Build context string
        context_parts = []

        # Summary statistics
        context_parts.append("## User's Study Statistics")
        context_parts.append(f"- Total study sessions: {stats.total_sessions}")
        context_parts.append(f"- Total study time: {stats.total_hours} hours ({stats.total_minutes} minutes)")
        context_parts.append(f"- Sessions this week: {stats.sessions_this_week}")
        context_parts.append(f"- Current study streak: {stats.study_streak} days")

        # Subject breakdown
        if stats.sessions_by_subject:
            context_parts.append("\n## Study Time by Subject")
            for subject_stat in stats.sessions_by_subject:
                hours = round(subject_stat.total_minutes / 60, 1)
                context_parts.append(
                    f"- {subject_stat.subject}: {subject_stat.total_sessions} sessions, "
                    f"{hours} hours ({subject_stat.total_minutes} minutes)"
                )

        # Recent sessions (last 10)
        recent_sessions = sessions[:10]
        if recent_sessions:
            context_parts.append("\n## Recent Study Sessions")
            for session in recent_sessions:
                notes_preview = ""
                if session.notes:
                    notes_preview = f" - Notes: {session.notes[:100]}..."
                context_parts.append(
                    f"- {session.session_date}: {session.subject} ({session.duration_minutes} min){notes_preview}"
                )

        # All subjects studied
        all_subjects = set(s.subject for s in sessions)
        context_parts.append(f"\n## All Subjects Studied")
        context_parts.append(f"Subjects: {', '.join(sorted(all_subjects))}")

        return "\n".join(context_parts)

    def _format_conversation_history(
        self, history: List[ChatMessage]
    ) -> List[dict]:
        """Format conversation history for Anthropic API."""
        return [{"role": msg.role, "content": msg.content} for msg in history]

    def chat(
        self,
        user_id: UUID,
        message: str,
        conversation_history: Optional[List[ChatMessage]] = None,
    ) -> str:
        """Process a chat message with RAG context."""
        logger.info(f"Processing chat for user: {user_id}")

        # Check if API key is configured
        if not self.settings.anthropic_api_key:
            logger.error("Anthropic API key not configured")
            raise ValueError(
                "Chat feature is not configured. Please set ANTHROPIC_API_KEY in environment variables."
            )

        # Build study context
        study_context = self._build_study_context(user_id)

        # Create system prompt with RAG context
        system_prompt = f"""You are a helpful study assistant for the Smart Study Session Manager app.
You help users understand their study patterns, provide encouragement, and give actionable advice.

Here is the user's study data that you can reference when answering their questions:

{study_context}

Guidelines:
- Be encouraging and supportive
- Give specific, actionable advice based on their actual data
- If they ask about data you don't have, let them know
- Keep responses concise but helpful
- Use the actual numbers and subjects from their data when relevant
- If they haven't studied much, be encouraging rather than critical"""

        # Initialize Anthropic client
        client = Anthropic(api_key=self.settings.anthropic_api_key)

        # Build messages
        messages = []
        if conversation_history:
            messages = self._format_conversation_history(conversation_history)
        messages.append({"role": "user", "content": message})

        logger.info("Sending request to Claude API")

        # Call Claude API
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=system_prompt,
            messages=messages,
        )

        assistant_response = response.content[0].text
        logger.info("Received response from Claude API")

        return assistant_response
