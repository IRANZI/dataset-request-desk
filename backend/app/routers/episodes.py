from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi import UploadFile, File
from app.services.import_service import import_episodes

from app.auth.dependencies import require_roles
from app.database import get_db
from app.models import Assignment, Episode, Request, User
from app.schemas.episode import EpisodeResponse


router = APIRouter(prefix="/episodes", tags=["Episodes"])


@router.get("", response_model=list[EpisodeResponse])
def list_episodes(
    task_name: str | None = None,
    quality: str | None = None,
    current_user: User = Depends(
        require_roles("operator", "admin")
    ),
    db: Session = Depends(get_db),
):
    query = db.query(Episode)

    if task_name:
        query = query.filter(
            Episode.task_name.ilike(f"%{task_name}%")
        )

    if quality:
        query = query.filter(Episode.quality == quality)

    return query.order_by(Episode.recorded_at.desc()).all()


@router.post("/{episode_id}/assign/{request_id}")
def assign_episode(
    episode_id: int,
    request_id: int,
    current_user: User = Depends(
        require_roles("operator", "admin")
    ),
    db: Session = Depends(get_db),
):
    episode = (
        db.query(Episode)
        .filter(Episode.id == episode_id)
        .first()
    )

    if episode is None:
        raise HTTPException(
            status_code=404,
            detail="Episode not found",
        )

    request = (
        db.query(Request)
        .filter(Request.id == request_id)
        .first()
    )

    if request is None:
        raise HTTPException(
            status_code=404,
            detail="Request not found",
        )

    if episode.quality != "good":
        raise HTTPException(
        status_code=400,
        detail="Only good episodes can be assigned",
    )

    existing = (
        db.query(Assignment)
        .filter(Assignment.episode_id == episode.id)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Episode is already assigned to a request",
        )

    if episode.task_name != request.task_name:
        raise HTTPException(
            status_code=400,
            detail="Episode task does not match request task",
        )

    assignment = Assignment(
        request_id=request.id,
        episode_id=episode.id,
    )

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {
        "message": "Episode assigned successfully",
        "assignment_id": assignment.id,
        "request_id": request.id,
        "episode_id": episode.id,
    }

@router.post("/import")
def import_episode_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(
        require_roles("operator", "admin")
    ),
    db: Session = Depends(get_db),
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported",
        )

    temporary_path = f"temp_{file.filename}"

    with open(
        temporary_path,
        "wb",
    ) as output:
        output.write(file.file.read())

    try:
        return import_episodes(
            db,
            temporary_path,
        )
    finally:
        import os

        if os.path.exists(temporary_path):
            os.remove(temporary_path)