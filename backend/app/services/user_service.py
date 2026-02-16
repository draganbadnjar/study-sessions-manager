from uuid import UUID
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.config import logger


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> Optional[User]:
        logger.info(f"Looking up user by email: {email}")
        return self.db.query(User).filter(User.email == email).first()

    def get_by_id(self, user_id: UUID) -> Optional[User]:
        logger.info(f"Looking up user by id: {user_id}")
        return self.db.query(User).filter(User.id == user_id).first()

    def create(self, user_data: UserCreate) -> User:
        logger.info(f"Creating new user with email: {user_data.email}")
        user = User(email=user_data.email)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        logger.info(f"User created successfully with id: {user.id}")
        return user
