from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.ticket import TicketCategory, TicketPriority, TicketStatus
from app.schemas.user import UserOut


class TicketCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=5000)
    category: TicketCategory = TicketCategory.GENERAL
    priority: TicketPriority = TicketPriority.MEDIUM

    @field_validator("title", "description")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("must not be blank")
        return v.strip()


class TicketUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, min_length=10, max_length=5000)
    category: TicketCategory | None = None
    priority: TicketPriority | None = None

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


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)

    @field_validator("body")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("must not be blank")
        return v.strip()


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    body: str
    author: UserOut
    created_at: datetime


class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    category: TicketCategory
    attachment_filename: str | None
    attachment_content_type: str | None
    attachment_size: int | None
    creator: UserOut
    assignee: UserOut | None
    updated_by: UserOut | None
    created_at: datetime
    updated_at: datetime
    status_changed_at: datetime | None
    comments: list[CommentOut] = []


class TicketListOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    status: TicketStatus
    priority: TicketPriority
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
    by_priority: dict[str, int] = {}


class AgentOverview(BaseModel):
    username: str
    active_tickets: int
    status: str
