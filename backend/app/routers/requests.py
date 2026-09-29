from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models import Request, User
from app.schemas.request import RequestCreate, RequestResponse


router = APIRouter(
    prefix="/requests",
    tags=["Requests"],
)


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
    request = Request(
        client_id=current_user.id,
        task_name=request_data.task_name,
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
        query = query.filter(
            Request.client_id == current_user.id
        )

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