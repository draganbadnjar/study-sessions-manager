from typing import List
from pydantic import BaseModel
from app.schemas.session import SessionResponse


class SubjectStats(BaseModel):
    subject: str
    total_sessions: int
    total_minutes: int


class UserStats(BaseModel):
    total_sessions: int
    total_minutes: int
    total_hours: float
    sessions_this_week: int
    study_streak: int
    sessions_by_subject: List[SubjectStats]
    recent_sessions: List[SessionResponse]
