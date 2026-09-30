from pydantic import BaseModel, EmailStr, Field


VALID_ROLES = {"admin", "operator", "client"}


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    organisation: str | None
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=255)
    organisation: str | None = None
    role: str = "client"


class UserRoleUpdate(BaseModel):
    role: str


class UserActiveUpdate(BaseModel):
    is_active: bool