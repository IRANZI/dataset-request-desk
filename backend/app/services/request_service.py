from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Request, StatusHistory, User, Assignment


ALLOWED_TRANSITIONS = {
    "submitted": {"in_progress"},
    "in_progress": {"delivered"},
    "delivered": {"accepted", "rejected"},
    "rejected": {"in_progress"},
    "accepted": set(),
}


def change_request_status(
    db: Session,
    request: Request,
    new_status: str,
    user: User,
):
    allowed_statuses = ALLOWED_TRANSITIONS.get(
        request.status,
        set(),
    )

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition: "
                   f"{request.status} -> {new_status}",
        )

    if new_status == "delivered":
        assigned_count = (
            db.query(Assignment)
            .filter(
                Assignment.request_id == request.id
            )
            .count()
        )

        if assigned_count < request.episodes_requested:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Cannot deliver request. "
                    f"{assigned_count}/"
                    f"{request.episodes_requested} "
                    f"episodes assigned."
                ),
            )

    old_status = request.status

    request.status = new_status

    history = StatusHistory(
        request_id=request.id,
        changed_by=user.id,
        old_status=old_status,
        new_status=new_status,
    )

    db.add(history)
    db.commit()
    db.refresh(request)

    return request