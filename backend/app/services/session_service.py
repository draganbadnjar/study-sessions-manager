from uuid import UUID
from datetime import date, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.session import Session as StudySession
from app.schemas.session import SessionCreate, SessionUpdate
from app.schemas.stats import UserStats, SubjectStats
from app.config import logger


class SessionService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_sessions(self, user_id: UUID) -> List[StudySession]:
        logger.info(f"Fetching sessions for user: {user_id}")
        return (
            self.db.query(StudySession)
            .filter(StudySession.user_id == user_id)
            .order_by(desc(StudySession.session_date), desc(StudySession.created_at))
            .all()
        )

    def get_by_id(self, session_id: UUID) -> Optional[StudySession]:
        logger.info(f"Fetching session by id: {session_id}")
        return self.db.query(StudySession).filter(StudySession.id == session_id).first()

    def create(self, user_id: UUID, session_data: SessionCreate) -> StudySession:
        logger.info(f"Creating session for user: {user_id}")
        session = StudySession(
            user_id=user_id,
            subject=session_data.subject,
            duration_minutes=session_data.duration_minutes,
            notes=session_data.notes,
            session_date=session_data.session_date,
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        logger.info(f"Session created with id: {session.id}")
        return session

    def update(self, session_id: UUID, session_data: SessionUpdate) -> Optional[StudySession]:
        logger.info(f"Updating session: {session_id}")
        session = self.get_by_id(session_id)
        if not session:
            return None

        update_data = session_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(session, field, value)

        self.db.commit()
        self.db.refresh(session)
        logger.info(f"Session updated: {session_id}")
        return session

    def delete(self, session_id: UUID) -> bool:
        logger.info(f"Deleting session: {session_id}")
        session = self.get_by_id(session_id)
        if not session:
            return False

        self.db.delete(session)
        self.db.commit()
        logger.info(f"Session deleted: {session_id}")
        return True

    def get_user_stats(self, user_id: UUID) -> UserStats:
        logger.info(f"Calculating stats for user: {user_id}")

        sessions = self.get_user_sessions(user_id)
        total_sessions = len(sessions)
        total_minutes = sum(s.duration_minutes for s in sessions)

        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        sessions_this_week = sum(1 for s in sessions if s.session_date >= week_start)

        streak = self._calculate_streak(user_id)

        subject_stats = (
            self.db.query(
                StudySession.subject,
                func.count(StudySession.id).label("total_sessions"),
                func.sum(StudySession.duration_minutes).label("total_minutes"),
            )
            .filter(StudySession.user_id == user_id)
            .group_by(StudySession.subject)
            .all()
        )

        sessions_by_subject = [
            SubjectStats(
                subject=stat.subject,
                total_sessions=stat.total_sessions,
                total_minutes=stat.total_minutes or 0,
            )
            for stat in subject_stats
        ]

        recent_sessions = sessions[:5]

        return UserStats(
            total_sessions=total_sessions,
            total_minutes=total_minutes,
            total_hours=round(total_minutes / 60, 1),
            sessions_this_week=sessions_this_week,
            study_streak=streak,
            sessions_by_subject=sessions_by_subject,
            recent_sessions=recent_sessions,
        )

    def _calculate_streak(self, user_id: UUID) -> int:
        session_dates = (
            self.db.query(StudySession.session_date)
            .filter(StudySession.user_id == user_id)
            .distinct()
            .order_by(desc(StudySession.session_date))
            .all()
        )

        if not session_dates:
            return 0

        dates = sorted(set(d[0] for d in session_dates), reverse=True)
        today = date.today()

        if dates[0] != today and dates[0] != today - timedelta(days=1):
            return 0

        streak = 1
        for i in range(1, len(dates)):
            if dates[i - 1] - dates[i] == timedelta(days=1):
                streak += 1
            else:
                break

        return streak
