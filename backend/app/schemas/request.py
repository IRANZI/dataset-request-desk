from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class RequestCreate(BaseModel):
    task_name: str = Field(
        min_length=1,
        max_length=255,
    )

    episodes_requested: int = Field(
        gt=0
    )

    deadline: date

    notes: str | None = None


class RequestResponse(BaseModel):
    id: int
    client_id: int
    task_name: str
    episodes_requested: int
    assigned_count: int = 0
    deadline: date
    notes: str | None
    status: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class RequestStatusUpdate(BaseModel):
    status: str