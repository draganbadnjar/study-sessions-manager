from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.session import SessionCreate, SessionResponse
from app.schemas.stats import UserStats
from app.services.user_service import UserService
from app.services.session_service import SessionService
from app.config import logger

router = APIRouter()


@router.get("/{user_id}/sessions", response_model=List[SessionResponse])
def get_user_sessions(user_id: UUID, db: Session = Depends(get_db)):
    logger.info(f"Fetching sessions for user: {user_id}")
    user_service = UserService(db)
    user = user_service.get_by_id(user_id)

    if not user:
        logger.warning(f"User not found: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    session_service = SessionService(db)
    sessions = session_service.get_user_sessions(user_id)
    return sessions


@router.post("/{user_id}/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(user_id: UUID, session_data: SessionCreate, db: Session = Depends(get_db)):
    logger.info(f"Creating session for user: {user_id}")
    user_service = UserService(db)
    user = user_service.get_by_id(user_id)

    if not user:
        logger.warning(f"User not found: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    session_service = SessionService(db)
    session = session_service.create(user_id, session_data)
    return session


@router.get("/{user_id}/stats", response_model=UserStats)
def get_user_stats(user_id: UUID, db: Session = Depends(get_db)):
    logger.info(f"Fetching stats for user: {user_id}")
    user_service = UserService(db)
    user = user_service.get_by_id(user_id)

    if not user:
        logger.warning(f"User not found: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    session_service = SessionService(db)
    stats = session_service.get_user_stats(user_id)
    return stats
