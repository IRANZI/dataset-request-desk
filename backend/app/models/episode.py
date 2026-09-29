from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Episode(Base):
    __tablename__ = "episodes"

    id: Mapped[int] = mapped_column(primary_key=True)

    episode_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    robot_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    task_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        index=True,
    )

    duration_seconds: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    operator_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    quality: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )