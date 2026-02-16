import os
from datetime import datetime, timedelta, date
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from mcp.server.fastmcp import FastMCP

# Load environment variables
load_dotenv()

# Initialize MCP server
mcp = FastMCP("Study Patterns")

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)


def get_db_connection():
    """Create database connection"""
    return engine.connect()


# =============================================================
# TOOL 0: Lookup User by Email
# =============================================================
@mcp.tool()
def lookup_user_by_email(email: str) -> dict:
    """
    Looks up a user by their email address and returns their user ID.
    Use this tool first to get the user_id needed for other analysis tools.

    Args:
        email: The email address of the user to look up

    Returns:
        Dictionary with user_id and email, or error if not found
    """
    query = text("""
        SELECT id, email, created_at
        FROM users
        WHERE LOWER(email) = LOWER(:email)
    """)

    with get_db_connection() as conn:
        result = conn.execute(query, {"email": email})
        row = result.fetchone()

    if not row:
        return {"error": f"No user found with email: {email}"}

    # Get session count for this user
    session_query = text("""
        SELECT COUNT(*) as session_count
        FROM sessions
        WHERE user_id = :user_id
    """)

    with get_db_connection() as conn:
        session_result = conn.execute(session_query, {"user_id": str(row.id)})
        session_row = session_result.fetchone()

    return {
        "user_id": str(row.id),
        "email": row.email,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "session_count": int(session_row.session_count) if session_row else 0
    }


# =============================================================
# TOOL 1: Get Productivity by Hour
# =============================================================
@mcp.tool()
def get_productivity_by_hour(user_id: str) -> dict:
    """
    Analyzes which hours of the day the user is most productive.
    Uses created_at timestamp to determine session creation time.

    Args:
        user_id: The UUID of the user to analyze

    Returns:
        Dictionary with hourly productivity data
    """
    query = text("""
        SELECT
            EXTRACT(HOUR FROM created_at) as hour,
            COUNT(*) as session_count,
            AVG(duration_minutes) as avg_duration,
            SUM(duration_minutes) as total_minutes
        FROM sessions
        WHERE user_id = :user_id
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY session_count DESC
    """)

    with get_db_connection() as conn:
        result = conn.execute(query, {"user_id": user_id})
        rows = result.fetchall()

    if not rows:
        return {"error": "No sessions found for this user"}

    hourly_data = []
    for row in rows:
        hourly_data.append({
            "hour": int(row.hour),
            "hour_formatted": f"{int(row.hour):02d}:00",
            "session_count": int(row.session_count),
            "avg_duration_minutes": round(float(row.avg_duration), 1) if row.avg_duration else 0,
            "total_minutes": int(row.total_minutes) if row.total_minutes else 0
        })

    # Find most productive hour
    most_productive = hourly_data[0] if hourly_data else None

    return {
        "hourly_breakdown": hourly_data,
        "most_productive_hour": most_productive,
        "total_sessions_analyzed": sum(h["session_count"] for h in hourly_data)
    }


# =============================================================
# TOOL 2: Get Neglected Subjects
# =============================================================
@mcp.tool()
def get_neglected_subjects(user_id: str, days: int = 14) -> dict:
    """
    Finds subjects the user hasn't studied recently compared to their history.

    Args:
        user_id: The UUID of the user to analyze
        days: Number of days to consider as "recent" (default: 14)

    Returns:
        Dictionary with neglected subjects and study frequency
    """
    # Get all subjects ever studied
    all_subjects_query = text("""
        SELECT
            subject,
            COUNT(*) as total_sessions,
            SUM(duration_minutes) as total_minutes,
            MAX(session_date) as last_studied
        FROM sessions
        WHERE user_id = :user_id
        GROUP BY subject
        ORDER BY total_sessions DESC
    """)

    # Get subjects studied in recent period
    recent_query = text("""
        SELECT DISTINCT subject
        FROM sessions
        WHERE user_id = :user_id
          AND session_date >= :cutoff_date
    """)

    cutoff_date = date.today() - timedelta(days=days)

    with get_db_connection() as conn:
        all_result = conn.execute(all_subjects_query, {"user_id": user_id})
        all_subjects = all_result.fetchall()

        recent_result = conn.execute(recent_query, {
            "user_id": user_id,
            "cutoff_date": cutoff_date
        })
        recent_subjects = {row.subject for row in recent_result.fetchall()}

    if not all_subjects:
        return {"error": "No sessions found for this user"}

    neglected = []
    active = []

    for row in all_subjects:
        days_since = (date.today() - row.last_studied).days if row.last_studied else None
        subject_data = {
            "subject": row.subject,
            "total_sessions": int(row.total_sessions),
            "total_hours": round(float(row.total_minutes) / 60, 1) if row.total_minutes else 0,
            "last_studied": row.last_studied.isoformat() if row.last_studied else None,
            "days_since_last_study": days_since
        }

        if row.subject in recent_subjects:
            active.append(subject_data)
        else:
            neglected.append(subject_data)

    return {
        "neglected_subjects": neglected,
        "active_subjects": active,
        "analysis_period_days": days,
        "total_subjects": len(all_subjects)
    }


# =============================================================
# TOOL 3: Get Study Trends
# =============================================================
@mcp.tool()
def get_study_trends(user_id: str, days: int = 30) -> dict:
    """
    Analyzes study trends over time - daily patterns, weekly patterns,
    total time spent, and trajectory.

    Args:
        user_id: The UUID of the user to analyze
        days: Number of days to analyze (default: 30)

    Returns:
        Dictionary with trend analysis
    """
    cutoff_date = date.today() - timedelta(days=days)

    # Daily totals
    daily_query = text("""
        SELECT
            session_date,
            COUNT(*) as sessions,
            SUM(duration_minutes) as total_minutes
        FROM sessions
        WHERE user_id = :user_id
          AND session_date >= :cutoff_date
        GROUP BY session_date
        ORDER BY session_date
    """)

    # Day of week analysis
    dow_query = text("""
        SELECT
            EXTRACT(DOW FROM session_date) as day_of_week,
            COUNT(*) as sessions,
            SUM(duration_minutes) as total_minutes,
            AVG(duration_minutes) as avg_duration
        FROM sessions
        WHERE user_id = :user_id
          AND session_date >= :cutoff_date
        GROUP BY EXTRACT(DOW FROM session_date)
        ORDER BY sessions DESC
    """)

    with get_db_connection() as conn:
        daily_result = conn.execute(daily_query, {
            "user_id": user_id,
            "cutoff_date": cutoff_date
        })
        daily_data = daily_result.fetchall()

        dow_result = conn.execute(dow_query, {
            "user_id": user_id,
            "cutoff_date": cutoff_date
        })
        dow_data = dow_result.fetchall()

    if not daily_data:
        return {"error": "No sessions found in this period"}

    # Process daily data
    daily_breakdown = []
    total_minutes = 0
    total_sessions = 0

    for row in daily_data:
        minutes = float(row.total_minutes) if row.total_minutes else 0
        daily_breakdown.append({
            "date": row.session_date.isoformat(),
            "sessions": int(row.sessions),
            "minutes": round(minutes, 1)
        })
        total_minutes += minutes
        total_sessions += int(row.sessions)

    # Process day of week data
    day_names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    weekly_pattern = []
    best_day = None

    for row in dow_data:
        day_info = {
            "day": day_names[int(row.day_of_week)],
            "day_number": int(row.day_of_week),
            "sessions": int(row.sessions),
            "total_minutes": int(row.total_minutes) if row.total_minutes else 0,
            "avg_duration": round(float(row.avg_duration), 1) if row.avg_duration else 0
        }
        weekly_pattern.append(day_info)
        if best_day is None:
            best_day = day_info

    # Calculate trend (comparing first half to second half)
    mid = len(daily_breakdown) // 2
    if mid > 0:
        first_half_avg = sum(d["minutes"] for d in daily_breakdown[:mid]) / mid
        second_half_avg = sum(d["minutes"] for d in daily_breakdown[mid:]) / (len(daily_breakdown) - mid)
        if second_half_avg > first_half_avg * 1.1:
            trend = "increasing"
        elif second_half_avg < first_half_avg * 0.9:
            trend = "decreasing"
        else:
            trend = "stable"
    else:
        trend = "insufficient data"

    # Calculate study streak
    streak = 0
    current_date = date.today()
    study_dates = {row.session_date for row in daily_data}

    while current_date in study_dates or (streak == 0 and current_date - timedelta(days=1) in study_dates):
        if current_date in study_dates:
            streak += 1
        current_date -= timedelta(days=1)

    return {
        "period_days": days,
        "total_sessions": total_sessions,
        "total_minutes": round(total_minutes, 1),
        "total_hours": round(total_minutes / 60, 1),
        "days_studied": len(daily_breakdown),
        "daily_average_minutes": round(total_minutes / days, 1),
        "study_day_average_minutes": round(total_minutes / len(daily_breakdown), 1) if daily_breakdown else 0,
        "current_streak_days": streak,
        "trend": trend,
        "best_day_of_week": best_day,
        "weekly_pattern": weekly_pattern,
        "daily_breakdown": daily_breakdown
    }


# =============================================================
# TOOL 4: Get Subject Distribution
# =============================================================
@mcp.tool()
def get_subject_distribution(user_id: str) -> dict:
    """
    Shows how study time is distributed across different subjects.

    Args:
        user_id: The UUID of the user to analyze

    Returns:
        Dictionary with subject distribution data
    """
    query = text("""
        SELECT
            subject,
            COUNT(*) as session_count,
            SUM(duration_minutes) as total_minutes,
            AVG(duration_minutes) as avg_session_length,
            MIN(session_date) as first_studied,
            MAX(session_date) as last_studied
        FROM sessions
        WHERE user_id = :user_id
        GROUP BY subject
        ORDER BY total_minutes DESC
    """)

    with get_db_connection() as conn:
        result = conn.execute(query, {"user_id": user_id})
        rows = result.fetchall()

    if not rows:
        return {"error": "No sessions found for this user"}

    total_time = sum(float(row.total_minutes or 0) for row in rows)

    distribution = []
    for row in rows:
        minutes = float(row.total_minutes) if row.total_minutes else 0
        distribution.append({
            "subject": row.subject,
            "session_count": int(row.session_count),
            "total_minutes": round(minutes, 1),
            "total_hours": round(minutes / 60, 1),
            "percentage": round((minutes / total_time) * 100, 1) if total_time > 0 else 0,
            "avg_session_minutes": round(float(row.avg_session_length), 1) if row.avg_session_length else 0,
            "first_studied": row.first_studied.isoformat() if row.first_studied else None,
            "last_studied": row.last_studied.isoformat() if row.last_studied else None
        })

    return {
        "subjects": distribution,
        "total_subjects": len(distribution),
        "total_study_hours": round(total_time / 60, 1),
        "most_studied": distribution[0]["subject"] if distribution else None,
        "least_studied": distribution[-1]["subject"] if distribution else None
    }


# =============================================================
# TOOL 5: Get User Summary
# =============================================================
@mcp.tool()
def get_user_summary(user_id: str) -> dict:
    """
    Provides a complete overview of the user's study patterns.
    Combines insights from all analysis tools.

    Args:
        user_id: The UUID of the user to analyze

    Returns:
        Dictionary with comprehensive user summary
    """
    summary_query = text("""
        SELECT
            COUNT(*) as total_sessions,
            SUM(duration_minutes) as total_minutes,
            AVG(duration_minutes) as avg_duration,
            MIN(session_date) as first_session,
            MAX(session_date) as last_session,
            COUNT(DISTINCT subject) as unique_subjects,
            COUNT(DISTINCT session_date) as days_studied
        FROM sessions
        WHERE user_id = :user_id
    """)

    with get_db_connection() as conn:
        result = conn.execute(summary_query, {"user_id": user_id})
        row = result.fetchone()

    if not row or not row.total_sessions:
        return {"error": "No sessions found for this user"}

    total_minutes = float(row.total_minutes) if row.total_minutes else 0
    days_on_platform = (date.today() - row.first_session).days + 1 if row.first_session else 0

    return {
        "total_sessions": int(row.total_sessions),
        "total_hours": round(total_minutes / 60, 1),
        "avg_session_minutes": round(float(row.avg_duration), 1) if row.avg_duration else 0,
        "unique_subjects": int(row.unique_subjects),
        "days_studied": int(row.days_studied),
        "first_session_date": row.first_session.isoformat() if row.first_session else None,
        "last_session_date": row.last_session.isoformat() if row.last_session else None,
        "days_on_platform": days_on_platform,
        "study_consistency_percent": round((int(row.days_studied) / days_on_platform) * 100, 1) if days_on_platform > 0 else 0
    }


# =============================================================
# Run the server
# =============================================================
if __name__ == "__main__":
    mcp.run()
