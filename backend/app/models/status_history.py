from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class StatusHistory(Base):
    __tablename__ = "status_history"

    id: Mapped[int] = mapped_column(primary_key=True)

    request_id: Mapped[int] = mapped_column(
        ForeignKey("requests.id"),
        nullable=False,
        index=True,
    )

    changed_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    old_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    new_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    changed_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )