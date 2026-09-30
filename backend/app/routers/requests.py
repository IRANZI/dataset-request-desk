from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models import Assignment, Request, User
from app.schemas.request import (
    RequestCreate,
    RequestResponse,
    RequestStatusUpdate,
)
from app.services.request_service import change_request_status


router = APIRouter(
    prefix="/requests",
    tags=["Requests"],
)


def request_to_response(
    request: Request,
    assigned_count: int,
):
    return {
        "id": request.id,
        "client_id": request.client_id,
        "task_name": request.task_name,
        "episodes_requested": request.episodes_requested,
        "assigned_count": assigned_count,
        "deadline": request.deadline,
        "notes": request.notes,
        "status": request.status,
        "created_at": request.created_at,
    }


@router.post(
    "",
    response_model=RequestResponse,
    status_code=201,
)
def create_request(
    payload: RequestCreate,
    current_user: User = Depends(
        require_roles("client")
    ),
    db: Session = Depends(get_db),
):
    task_name = " ".join(
        payload.task_name.strip().lower().split()
    )

    request = Request(
        client_id=current_user.id,
        task_name=task_name,
        episodes_requested=payload.episodes_requested,
        deadline=payload.deadline,
        notes=payload.notes,
        status="submitted",
    )

    db.add(request)
    db.commit()
    db.refresh(request)

    return request_to_response(
        request,
        assigned_count=0,
    )


@router.get(
    "",
    response_model=list[RequestResponse],
)
def list_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Request)

    if current_user.role == "client":
        query = query.filter(
            Request.client_id == current_user.id
        )

    elif current_user.role not in {
        "operator",
        "admin",
    }:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view requests",
        )

    requests = (
        query
        .order_by(Request.created_at.desc())
        .all()
    )

    result = []

    for request in requests:
        assigned_count = (
            db.query(Assignment)
            .filter(
                Assignment.request_id == request.id
            )
            .count()
        )

        result.append(
            request_to_response(
                request,
                assigned_count,
            )
        )

    return result


@router.get(
    "/{request_id}",
    response_model=RequestResponse,
)
def get_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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

    if (
        current_user.role == "client"
        and request.client_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view this request",
        )

    assigned_count = (
        db.query(Assignment)
        .filter(
            Assignment.request_id == request.id
        )
        .count()
    )

    return request_to_response(
        request,
        assigned_count,
    )


@router.patch(
    "/{request_id}/status",
    response_model=RequestResponse,
)
def update_request_status(
    request_id: int,
    payload: RequestStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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

    new_status = payload.status.strip().lower()

    # --------------------------------------------------
    # Check permissions
    # --------------------------------------------------

    if current_user.role == "client":

        if request.client_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only update your own requests",
            )

        if new_status not in {
            "accepted",
            "rejected",
        }:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Clients can only accept or reject "
                    "delivered requests"
                ),
            )

    elif current_user.role in {
        "operator",
        "admin",
    }:

        if new_status not in {
            "in_progress",
            "delivered",
        }:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Operators can only start or deliver requests"
                ),
            )

    else:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to update requests",
        )

    # --------------------------------------------------
    # IMPORTANT:
    # Validate the workflow transition BEFORE checking
    # delivery requirements.
    #
    # This means submitted -> delivered correctly gives
    # "Invalid status transition".
    # --------------------------------------------------

    allowed_transitions = {
        "submitted": {"in_progress"},
        "in_progress": {"delivered"},
        "delivered": {"accepted", "rejected"},
        "rejected": {"in_progress"},
        "accepted": set(),
    }

    allowed = allowed_transitions.get(
        request.status,
        set(),
    )

    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid status transition: "
                f"{request.status} -> {new_status}"
            ),
        )

    # --------------------------------------------------
    # Delivery validation
    # --------------------------------------------------

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
                    f"Cannot deliver this request yet. "
                    f"{assigned_count} of "
                    f"{request.episodes_requested} "
                    "episodes assigned."
                ),
            )

        if assigned_count > request.episodes_requested:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Cannot deliver this request. "
                    f"{assigned_count} episodes assigned, "
                    f"but only "
                    f"{request.episodes_requested} "
                    "were requested."
                ),
            )

    # --------------------------------------------------
    # Perform transition + create history
    # --------------------------------------------------

    updated_request = change_request_status(
        db=db,
        request=request,
        new_status=new_status,
        changed_by=current_user.id,
    )

    assigned_count = (
        db.query(Assignment)
        .filter(
            Assignment.request_id
            == updated_request.id
        )
        .count()
    )

    return request_to_response(
        updated_request,
        assigned_count,
    )