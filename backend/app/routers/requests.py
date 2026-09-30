from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models import Request, User
from app.schemas.request import RequestCreate, RequestResponse
from app.services.request_service import change_request_status


router = APIRouter(prefix="/requests", tags=["Requests"])


class StatusUpdate(BaseModel):
    status: str


@router.post(
    "",
    response_model=RequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_request(
    request_data: RequestCreate,
    current_user: User = Depends(require_roles("client")),
    db: Session = Depends(get_db),
):
    task_name = " ".join(request_data.task_name.strip().lower().split())

    request = Request(
    client_id=current_user.id,
    task_name=task_name,
    episodes_requested=request_data.episodes_requested,
    deadline=request_data.deadline,
    notes=request_data.notes,
    status="submitted",
)

    db.add(request)
    db.commit()
    db.refresh(request)

    return request


@router.get("", response_model=list[RequestResponse])
def list_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Request)

    if current_user.role == "client":
        query = query.filter(Request.client_id == current_user.id)

    return query.order_by(Request.created_at.desc()).all()


@router.get("/{request_id}", response_model=RequestResponse)
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
            detail="You can only access your own requests",
        )

    return request


@router.patch("/{request_id}/status", response_model=RequestResponse)
def update_status(
    request_id: int,
    status_data: StatusUpdate,
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
            detail="You can only modify your own requests",
        )

    # Clients can only accept or reject.
    if current_user.role == "client":
        if status_data.status not in {"accepted", "rejected"}:
            raise HTTPException(
                status_code=403,
                detail="Clients can only accept or reject requests",
            )

    # Operators/admins handle operational workflow.
    if current_user.role in {"operator", "admin"}:
        if status_data.status not in {"in_progress", "delivered"}:
            raise HTTPException(
                status_code=403,
                detail="Operators can only move requests to in_progress or delivered",
            )

    return change_request_status(
        db,
        request,
        status_data.status,
        current_user,
    )