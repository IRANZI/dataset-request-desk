from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.database import get_db
from app.models import Episode, Request, User


router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/episodes-per-day")
def episodes_per_day(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: User = Depends(require_roles("operator", "admin")),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            func.date(Episode.recorded_at).label("day"),
            Episode.robot_id,
            func.count(Episode.id).label("count"),
        )
        .filter(
            func.date(Episode.recorded_at) >= start_date,
            func.date(Episode.recorded_at) <= end_date,
        )
        .group_by(
            func.date(Episode.recorded_at),
            Episode.robot_id,
        )
        .order_by(
            func.date(Episode.recorded_at),
            Episode.robot_id,
        )
        .all()
    )

    return [
        {
            "day": str(row.day),
            "robot_id": row.robot_id,
            "count": row.count,
        }
        for row in rows
    ]

@router.get("/summary")
def analytics_summary(
    current_user: User = Depends(require_roles("operator", "admin")),
    db: Session = Depends(get_db),
):
    total_episodes = db.query(func.count(Episode.id)).scalar() or 0

    total_requests = db.query(func.count(Request.id)).scalar() or 0

    delivered_requests = (
        db.query(func.count(Request.id))
        .filter(Request.status == "delivered")
        .scalar()
        or 0
    )

    accepted_requests = (
        db.query(func.count(Request.id))
        .filter(Request.status == "accepted")
        .scalar()
        or 0
    )

    return {
        "total_episodes": total_episodes,
        "total_requests": total_requests,
        "delivered_requests": delivered_requests,
        "accepted_requests": accepted_requests,
    }

@router.get("/requests")
def request_analytics(
    current_user: User = Depends(require_roles("operator", "admin")),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            Request.status,
            func.count(Request.id).label("count"),
        )
        .group_by(Request.status)
        .order_by(Request.status)
        .all()
    )

    return [
        {
            "status": row.status,
            "count": row.count,
        }
        for row in rows
    ]


@router.get("/top-tasks")
def top_tasks(
    current_user: User = Depends(require_roles("operator", "admin")),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            Episode.task_name,
            func.count(Episode.id).label("count"),
        )
        .filter(Episode.quality == "good")
        .group_by(Episode.task_name)
        .order_by(func.count(Episode.id).desc())
        .limit(5)
        .all()
    )

    return [
        {
            "task_name": row.task_name,
            "count": row.count,
        }
        for row in rows
    ]


@router.get("/delivery-time")
def delivery_time(
    current_user: User = Depends(require_roles("operator", "admin")),
    db: Session = Depends(get_db),
):
    result = db.execute(
        text(
            """
            SELECT percentile_cont(0.5)
            WITHIN GROUP (
                ORDER BY EXTRACT(
                    EPOCH FROM (
                        delivered.changed_at - requests.created_at
                    )
                )
            ) AS median_seconds
            FROM requests
            JOIN status_history delivered
                ON delivered.request_id = requests.id
            WHERE delivered.new_status = 'delivered'
            """
        )
    ).scalar()

    return {
        "median_seconds": float(result) if result is not None else None
    }