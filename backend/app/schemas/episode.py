from datetime import datetime
from pydantic import BaseModel


class EpisodeResponse(BaseModel):
    id: int
    episode_id: str
    robot_id: str
    task_name: str
    recorded_at: datetime
    duration_seconds: int
    operator_name: str
    quality: str

    class Config:
        from_attributes = True