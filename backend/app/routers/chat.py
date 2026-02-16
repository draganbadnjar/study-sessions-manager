from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.user_service import UserService
from app.services.chat_service import ChatService
from app.config import logger

router = APIRouter()


@router.post("/{user_id}/chat", response_model=ChatResponse)
def chat_with_assistant(
    user_id: UUID, chat_request: ChatRequest, db: Session = Depends(get_db)
):
    """
    Send a message to the AI study assistant.

    The assistant has access to the user's study data and can answer
    questions about study patterns, provide advice, and offer encouragement.
    """
    logger.info(f"Chat request from user: {user_id}")

    # Verify user exists
    user_service = UserService(db)
    user = user_service.get_by_id(user_id)

    if not user:
        logger.warning(f"User not found: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Process chat message
    chat_service = ChatService(db)
    try:
        response = chat_service.chat(
            user_id=user_id,
            message=chat_request.message,
            conversation_history=chat_request.conversation_history,
        )
        return ChatResponse(response=response, context_used=True)
    except ValueError as e:
        logger.error(f"Chat configuration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat message. Please try again.",
        )
