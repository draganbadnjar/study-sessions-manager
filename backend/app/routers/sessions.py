from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.session import SessionUpdate, SessionResponse
from app.services.session_service import SessionService
from app.config import logger

router = APIRouter()


@router.put("/{session_id}", response_model=SessionResponse)
def update_session(session_id: UUID, session_data: SessionUpdate, db: Session = Depends(get_db)):
    logger.info(f"Updating session: {session_id}")
    session_service = SessionService(db)

    session = session_service.get_by_id(session_id)
    if not session:
        logger.warning(f"Session not found: {session_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    updated_session = session_service.update(session_id, session_data)
    return updated_session


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: UUID, db: Session = Depends(get_db)):
    logger.info(f"Deleting session: {session_id}")
    session_service = SessionService(db)

    session = session_service.get_by_id(session_id)
    if not session:
        logger.warning(f"Session not found: {session_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    session_service.delete(session_id)
    return None
