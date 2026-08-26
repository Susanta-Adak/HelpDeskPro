from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.ticket import Ticket, TicketStatus
from app.models.user import User, UserRole

# Only forward transitions are allowed, one step at a time.
ALLOWED_TRANSITIONS: dict[TicketStatus, set[TicketStatus]] = {
    TicketStatus.OPEN: {TicketStatus.IN_PROGRESS},
    TicketStatus.IN_PROGRESS: {TicketStatus.CLOSED},
    TicketStatus.CLOSED: set(),
}


def get_ticket_or_404(db: Session, ticket_id: int) -> Ticket:
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return ticket


def get_owned_ticket_or_404(db: Session, ticket_id: int, user: User) -> Ticket:
    ticket = get_ticket_or_404(db, ticket_id)
    if ticket.creator_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your ticket")
    return ticket


def create_ticket(db: Session, creator: User, title: str, description: str) -> Ticket:
    ticket = Ticket(title=title, description=description, creator_id=creator.id, status=TicketStatus.OPEN)
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


def assert_editable(ticket: Ticket) -> None:
    if ticket.status != TicketStatus.OPEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket can only be edited while status is Open",
        )


def update_ticket(db: Session, ticket: Ticket, title: str | None, description: str | None) -> Ticket:
    assert_editable(ticket)
    if title is not None:
        ticket.title = title
    if description is not None:
        ticket.description = description
    db.commit()
    db.refresh(ticket)
    return ticket


def delete_own_ticket(db: Session, ticket: Ticket) -> None:
    assert_editable(ticket)
    db.delete(ticket)
    db.commit()


def change_status(db: Session, ticket: Ticket, new_status: TicketStatus, actor: User) -> Ticket:
    allowed = ALLOWED_TRANSITIONS.get(ticket.status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition ticket from {ticket.status.value} to {new_status.value}",
        )
    ticket.status = new_status
    ticket.status_changed_at = datetime.now(timezone.utc)
    ticket.updated_by_id = actor.id
    db.commit()
    db.refresh(ticket)
    return ticket


def assign_ticket(db: Session, ticket: Ticket, assignee_id: int, actor: User) -> Ticket:
    assignee = db.query(User).filter(User.id == assignee_id).first()
    if assignee is None or assignee.role != UserRole.SUPPORT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="assignee_id must reference an existing support user",
        )
    ticket.assignee_id = assignee.id
    ticket.updated_by_id = actor.id
    db.commit()
    db.refresh(ticket)
    return ticket


def delete_ticket_admin(db: Session, ticket: Ticket) -> None:
    db.delete(ticket)
    db.commit()


def get_dashboard_stats(db: Session) -> dict:
    total = db.query(func.count(Ticket.id)).scalar() or 0
    open_count = db.query(func.count(Ticket.id)).filter(Ticket.status == TicketStatus.OPEN).scalar() or 0
    in_progress_count = (
        db.query(func.count(Ticket.id)).filter(Ticket.status == TicketStatus.IN_PROGRESS).scalar() or 0
    )
    closed_count = db.query(func.count(Ticket.id)).filter(Ticket.status == TicketStatus.CLOSED).scalar() or 0

    by_assignee_rows = (
        db.query(User.username, func.count(Ticket.id))
        .join(Ticket, Ticket.assignee_id == User.id)
        .group_by(User.username)
        .all()
    )

    return {
        "total": total,
        "open": open_count,
        "in_progress": in_progress_count,
        "closed": closed_count,
        "by_assignee": {username: count for username, count in by_assignee_rows},
    }
