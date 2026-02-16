from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import LoginRequest, UserResponse, UserCreate
from app.services.user_service import UserService
from app.config import logger

router = APIRouter()


@router.post("/login", response_model=UserResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    logger.info(f"Login attempt for email: {request.email}")
    user_service = UserService(db)
    user = user_service.get_by_email(request.email)

    if not user:
        logger.warning(f"Login failed - user not found: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please check your email address.",
        )

    logger.info(f"Login successful for user: {user.id}")
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(request: UserCreate, db: Session = Depends(get_db)):
    logger.info(f"Registration attempt for email: {request.email}")
    user_service = UserService(db)

    existing_user = user_service.get_by_email(request.email)
    if existing_user:
        logger.warning(f"Registration failed - email already exists: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    user = user_service.create(request)
    logger.info(f"Registration successful for user: {user.id}")
    return user
