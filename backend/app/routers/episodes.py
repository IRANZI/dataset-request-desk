from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.database import get_db
from app.models import Assignment, Episode, Request, User
from app.schemas.episode import EpisodeResponse
from app.services.import_service import import_episodes


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
        query = query.filter(
            Episode.quality == quality
        )

    return (
        query
        .order_by(Episode.recorded_at.desc())
        .all()
    )


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

    # Episodes can only be assigned while the request
    # is actively being worked on.
    if request.status != "in_progress":
        raise HTTPException(
            status_code=400,
            detail=(
                "Episodes can only be assigned to requests "
                "that are in progress."
            ),
        )

    # Both good and usable episodes are valid.
    # Bad episodes cannot be assigned.
    if episode.quality not in {"good", "usable"}:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only good or usable episodes can be assigned"
            ),
        )

    # An episode can belong to only one request.
    existing = (
        db.query(Assignment)
        .filter(
            Assignment.episode_id == episode.id
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail=(
                "Episode is already assigned to a request"
            ),
        )

    # Normalize task names before comparing them.
    episode_task = (
        " ".join(
            episode.task_name.strip().lower().split()
        )
    )

    request_task = (
        " ".join(
            request.task_name.strip().lower().split()
        )
    )

    if episode_task != request_task:
        raise HTTPException(
            status_code=400,
            detail=(
                "Episode task does not match request task"
            ),
        )

    # IMPORTANT:
    # Never allow more episodes than the client requested.
    assigned_count = (
        db.query(Assignment)
        .filter(
            Assignment.request_id == request.id
        )
        .count()
    )

    if assigned_count >= request.episodes_requested:
        raise HTTPException(
            status_code=400,
            detail=(
                f"This request already has all "
                f"{request.episodes_requested} requested "
                "episodes assigned."
            ),
        )

    assignment = Assignment(
        request_id=request.id,
        episode_id=episode.id,
    )

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    new_assigned_count = assigned_count + 1

    return {
        "message": "Episode assigned successfully",
        "assignment_id": assignment.id,
        "request_id": request.id,
        "episode_id": episode.id,
        "assigned_count": new_assigned_count,
        "episodes_requested": request.episodes_requested,
        "remaining": max(
            request.episodes_requested
            - new_assigned_count,
            0,
        ),
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

    with open(temporary_path, "wb") as output:
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