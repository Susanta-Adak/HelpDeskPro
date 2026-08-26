from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.models.ticket import Ticket, TicketCategory, TicketPriority, TicketStatus
from app.models.user import User, UserRole

# Forward transitions move one step at a time; the only backward transition is
# reopening a closed ticket, which is restricted to admins (see assert_can_change_status).
ALLOWED_TRANSITIONS: dict[TicketStatus, set[TicketStatus]] = {
    TicketStatus.OPEN: {TicketStatus.IN_PROGRESS},
    TicketStatus.IN_PROGRESS: {TicketStatus.CLOSED},
    TicketStatus.CLOSED: {TicketStatus.OPEN},
}

ACTIVE_STATUSES = {TicketStatus.OPEN, TicketStatus.IN_PROGRESS}


def get_ticket_or_404(db: Session, ticket_id: int) -> Ticket:
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return ticket


def can_access_ticket(ticket: Ticket, user: User) -> bool:
    return ticket.creator_id == user.id or ticket.assignee_id == user.id or user.role == UserRole.ADMIN


def get_ticket_visible_to(db: Session, ticket_id: int, user: User) -> Ticket:
    ticket = get_ticket_or_404(db, ticket_id)
    if not can_access_ticket(ticket, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your ticket")
    return ticket


def assert_creator(ticket: Ticket, user: User) -> None:
    if ticket.creator_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the creator can do this")


def assert_can_change_status(ticket: Ticket, user: User, new_status: TicketStatus) -> None:
    is_reopen = ticket.status == TicketStatus.CLOSED and new_status == TicketStatus.OPEN
    if is_reopen:
        if user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only an admin can reopen a closed ticket",
            )
        return
    if user.role != UserRole.ADMIN and ticket.assignee_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assignee or an admin can change ticket status",
        )


def list_visible_tickets(db: Session, user: User) -> list[Ticket]:
    return (
        db.query(Ticket)
        .filter(or_(Ticket.creator_id == user.id, Ticket.assignee_id == user.id))
        .order_by(Ticket.created_at.desc())
        .all()
    )


def create_ticket(
    db: Session,
    creator: User,
    title: str,
    description: str,
    category: TicketCategory,
    priority: TicketPriority,
    attachment: tuple[str, str, str, int] | None = None,
) -> Ticket:
    ticket = Ticket(
        title=title,
        description=description,
        category=category,
        priority=priority,
        creator_id=creator.id,
        status=TicketStatus.OPEN,
    )
    if attachment is not None:
        stored_name, original_name, content_type, size = attachment
        ticket.attachment_path = stored_name
        ticket.attachment_filename = original_name
        ticket.attachment_content_type = content_type
        ticket.attachment_size = size
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


def assert_editable(ticket: Ticket) -> None:
    if ticket.status != TicketStatus.OPEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket can only be deleted while status is Open",
        )


def update_ticket(
    db: Session,
    ticket: Ticket,
    user: User,
    title: str | None,
    description: str | None,
    category: TicketCategory | None,
    priority: TicketPriority | None,
) -> Ticket:
    assert_creator(ticket, user)
    if title is not None:
        ticket.title = title
    if description is not None:
        ticket.description = description
    if category is not None:
        ticket.category = category
    if priority is not None:
        ticket.priority = priority
    db.commit()
    db.refresh(ticket)
    return ticket


def delete_own_ticket(db: Session, ticket: Ticket, user: User) -> None:
    assert_creator(ticket, user)
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


def reassign_ticket(db: Session, ticket: Ticket, assignee_id: int, actor: User) -> Ticket:
    assignee = db.query(User).filter(User.id == assignee_id).first()
    if assignee is None or assignee.role != UserRole.SUPPORT or not assignee.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="assignee_id must reference an existing, active support user",
        )
    ticket.assignee_id = assignee.id
    ticket.updated_by_id = actor.id
    db.commit()
    db.refresh(ticket)
    return ticket


def add_comment(db: Session, ticket: Ticket, author: User, body: str) -> Comment:
    comment = Comment(ticket_id=ticket.id, author_id=author.id, body=body)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


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
    by_priority_rows = db.query(Ticket.priority, func.count(Ticket.id)).group_by(Ticket.priority).all()

    return {
        "total": total,
        "open": open_count,
        "in_progress": in_progress_count,
        "closed": closed_count,
        "by_assignee": {username: count for username, count in by_assignee_rows},
        "by_priority": {priority.value: count for priority, count in by_priority_rows},
    }


def get_team_overview(db: Session) -> list[dict]:
    agents = db.query(User).filter(User.role == UserRole.SUPPORT).order_by(User.username).all()
    overview = []
    for agent in agents:
        active_tickets = (
            db.query(func.count(Ticket.id))
            .filter(Ticket.assignee_id == agent.id, Ticket.status.in_(ACTIVE_STATUSES))
            .scalar()
            or 0
        )
        overview.append(
            {
                "username": agent.username,
                "active_tickets": active_tickets,
                "status": "active" if active_tickets > 0 else "idle",
            }
        )
    return overview
