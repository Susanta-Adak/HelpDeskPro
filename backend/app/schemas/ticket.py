from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.ticket import TicketStatus
from app.schemas.user import UserOut


class TicketCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=5000)

    @field_validator("title", "description")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("must not be blank")
        return v.strip()


class TicketUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, min_length=10, max_length=5000)

    @field_validator("title", "description")
    @classmethod
    def not_blank(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("must not be blank")
        return v.strip() if v is not None else v


class TicketStatusUpdate(BaseModel):
    status: TicketStatus


class TicketAssign(BaseModel):
    assignee_id: int


class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    status: TicketStatus
    creator: UserOut
    assignee: UserOut | None
    updated_by: UserOut | None
    created_at: datetime
    updated_at: datetime
    status_changed_at: datetime | None


class TicketListOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    status: TicketStatus
    creator: UserOut
    assignee: UserOut | None
    created_at: datetime
    updated_at: datetime


class PaginatedTickets(BaseModel):
    items: list[TicketListOut]
    total: int
    page: int
    page_size: int


class DashboardStats(BaseModel):
    total: int
    open: int
    in_progress: int
    closed: int
    by_assignee: dict[str, int] = {}
