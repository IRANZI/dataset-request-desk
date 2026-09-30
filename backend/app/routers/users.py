from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.auth.security import hash_password
from app.database import get_db
from app.models import User
from app.schemas.user import (
    UserActiveUpdate,
    UserCreate,
    UserResponse,
    UserRoleUpdate,
    VALID_ROLES,
)


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "organisation": current_user.organisation,
        "role": current_user.role,
        "is_active": current_user.is_active,
    }


@router.get("", response_model=list[UserResponse])
def list_users(
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    if user_data.role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Use admin, operator, or client.",
        )

    existing_user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="A user with this email already exists.",
        )

    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        name=user_data.name.strip(),
        organisation=user_data.organisation,
        role=user_data.role,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.patch(
    "/{user_id}/role",
    response_model=UserResponse,
)
def update_user_role(
    user_id: int,
    role_data: UserRoleUpdate,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    if role_data.role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Use admin, operator, or client.",
        )

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    user.role = role_data.role

    db.commit()
    db.refresh(user)

    return user


@router.patch(
    "/{user_id}/active",
    response_model=UserResponse,
)
def update_user_active(
    user_id: int,
    active_data: UserActiveUpdate,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if user.id == current_user.id and not active_data.is_active:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own admin account.",
        )

    user.is_active = active_data.is_active

    db.commit()
    db.refresh(user)

    return user