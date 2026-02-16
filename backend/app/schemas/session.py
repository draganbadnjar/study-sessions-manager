from datetime import datetime, date
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class SessionBase(BaseModel):
    subject: str = Field(..., min_length=1, max_length=100)
    duration_minutes: int = Field(..., gt=0)
    notes: Optional[str] = None
    session_date: date = Field(default_factory=date.today)


class SessionCreate(SessionBase):
    pass


class SessionUpdate(BaseModel):
    subject: Optional[str] = Field(None, min_length=1, max_length=100)
    duration_minutes: Optional[int] = Field(None, gt=0)
    notes: Optional[str] = None
    session_date: Optional[date] = None


class SessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    subject: str
    duration_minutes: int
    notes: Optional[str]
    session_date: date
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
