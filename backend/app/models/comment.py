from datetime import datetime

from sqlalchemy import ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.types import UTCDateTime


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey("tickets.id"), nullable=False)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), server_default=func.now())

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="comments")
    author: Mapped["User"] = relationship("User")
