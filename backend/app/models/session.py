import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Integer, Text, Date, DateTime, ForeignKey, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String(100), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    session_date = Column(Date, nullable=False, default=date.today)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="sessions")

    __table_args__ = (
        CheckConstraint("duration_minutes > 0", name="check_duration_positive"),
        Index("idx_sessions_user_id", "user_id"),
        Index("idx_sessions_session_date", "session_date"),
        Index("idx_sessions_user_date", "user_id", "session_date"),
    )
