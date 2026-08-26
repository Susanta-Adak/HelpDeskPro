from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.db.session import get_db
from app.models.ticket import Ticket, TicketStatus
from app.models.user import User, UserRole
from app.schemas.ticket import (
    AgentOverview,
    DashboardStats,
    PaginatedTickets,
    TicketAssign,
    TicketOut,
    TicketStatusUpdate,
)
from app.schemas.user import UserCreate, UserOut, UserStatusUpdate
from app.services import ticket_service, user_service

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/tickets", response_model=PaginatedTickets)
def list_all_tickets(
    db: Session = Depends(get_db),
    search: str | None = Query(default=None, description="Search by ticket title or username"),
    status_filter: TicketStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedTickets:
    query = db.query(Ticket).join(User, Ticket.creator_id == User.id)

    if search:
        like = f"%{search}%"
        query = query.filter((Ticket.title.ilike(like)) | (User.username.ilike(like)))

    if status_filter:
        query = query.filter(Ticket.status == status_filter)

    total = query.count()
    items = (
        query.order_by(Ticket.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PaginatedTickets(items=items, total=total, page=page, page_size=page_size)


@router.get("/tickets/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)) -> Ticket:
    return ticket_service.get_ticket_or_404(db, ticket_id)


@router.patch("/tickets/{ticket_id}/status", response_model=TicketOut)
def change_status(
    ticket_id: int,
    payload: TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Ticket:
    ticket = ticket_service.get_ticket_or_404(db, ticket_id)
    return ticket_service.change_status(db, ticket, payload.status, current_user)


@router.patch("/tickets/{ticket_id}/assign", response_model=TicketOut)
def assign_ticket(
    ticket_id: int,
    payload: TicketAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Ticket:
    ticket = ticket_service.get_ticket_or_404(db, ticket_id)
    return ticket_service.reassign_ticket(db, ticket, payload.assignee_id, current_user)


@router.delete("/tickets/{ticket_id}", status_code=204)
def delete_ticket(ticket_id: int, db: Session = Depends(get_db)) -> None:
    ticket = ticket_service.get_ticket_or_404(db, ticket_id)
    ticket_service.delete_ticket_admin(db, ticket)


@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(db: Session = Depends(get_db)) -> DashboardStats:
    return DashboardStats(**ticket_service.get_dashboard_stats(db))


@router.get("/support-users", response_model=list[UserOut])
def list_support_users(db: Session = Depends(get_db)) -> list[User]:
    return (
        db.query(User)
        .filter(User.role == UserRole.SUPPORT, User.is_active.is_(True))
        .order_by(User.username)
        .all()
    )


@router.get("/team-overview", response_model=list[AgentOverview])
def team_overview(db: Session = Depends(get_db)) -> list[dict]:
    return ticket_service.get_team_overview(db)


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)) -> list[User]:
    return user_service.list_users(db)


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    return user_service.create_user(db, payload.username, payload.password, payload.role)


@router.patch("/users/{user_id}/status", response_model=UserOut)
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> User:
    target = user_service.get_user_or_404(db, user_id)
    return user_service.set_user_active(db, target, current_user, payload.is_active)
