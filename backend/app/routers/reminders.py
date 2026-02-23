from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.session import Session as StudySession
from app.config import get_settings, logger

router = APIRouter()


class UserReminder(BaseModel):
    user_id: str
    email: str

    class Config:
        from_attributes = True


class UsersWithoutSessionsResponse(BaseModel):
    date: str
    count: int
    users: List[UserReminder]


def verify_api_key(x_api_key: str = Header(..., alias="X-API-Key")):
    """Verify the API key from request header."""
    settings = get_settings()
    if not settings.n8n_api_key:
        logger.warning("N8N_API_KEY not configured")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Reminder service not configured"
        )
    if x_api_key != settings.n8n_api_key:
        logger.warning("Invalid API key attempt")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    return x_api_key


@router.get(
    "/users-without-sessions-today",
    response_model=UsersWithoutSessionsResponse,
    dependencies=[Depends(verify_api_key)]
)
def get_users_without_sessions_today(db: Session = Depends(get_db)):
    """
    Get all users who haven't logged a study session today.
    This endpoint is used by n8n to send email reminders.
    Requires X-API-Key header for authentication.
    """
    logger.info("Fetching users without sessions today for reminder")

    today = date.today()

    # Subquery to get user_ids who have sessions today
    users_with_sessions_today = (
        db.query(StudySession.user_id)
        .filter(StudySession.session_date == today)
        .distinct()
        .subquery()
    )

    # Get all users who are NOT in the above subquery
    users_without_sessions = (
        db.query(User)
        .filter(User.id.notin_(
            db.query(users_with_sessions_today.c.user_id)
        ))
        .all()
    )

    result = [
        UserReminder(user_id=str(user.id), email=user.email)
        for user in users_without_sessions
    ]

    logger.info(f"Found {len(result)} users without sessions today")

    return UsersWithoutSessionsResponse(
        date=today.isoformat(),
        count=len(result),
        users=result
    )
