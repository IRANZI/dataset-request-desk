from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.models import User


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


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