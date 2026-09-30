from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Request, StatusHistory


ALLOWED_TRANSITIONS = {
    "submitted": {
        "in_progress",
    },
    "in_progress": {
        "delivered",
    },
    "delivered": {
        "accepted",
        "rejected",
    },
    "rejected": {
        "in_progress",
    },
    "accepted": set(),
}


def change_request_status(
    db: Session,
    request: Request,
    new_status: str,
    changed_by: int,
):
    old_status = request.status

    allowed = ALLOWED_TRANSITIONS.get(
        old_status,
        set(),
    )

    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid status transition: "
                f"{old_status} -> {new_status}"
            ),
        )

    history = StatusHistory(
        request_id=request.id,
        old_status=old_status,
        new_status=new_status,
        changed_by=changed_by,
    )

    request.status = new_status

    db.add(history)
    db.commit()
    db.refresh(request)

    return request