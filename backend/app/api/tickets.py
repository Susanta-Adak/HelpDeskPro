from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.files import UPLOAD_DIR, save_upload
from app.db.session import get_db
from app.models.ticket import Ticket, TicketCategory, TicketPriority
from app.models.user import User, UserRole
from app.schemas.ticket import (
    CommentCreate,
    CommentOut,
    TicketAssign,
    TicketCreate,
    TicketOut,
    TicketStatusUpdate,
    TicketUpdate,
)
from app.schemas.user import UserOut
from app.services import ticket_service

router = APIRouter(prefix="/tickets", tags=["tickets"])


def _format_validation_error(exc: ValidationError) -> str:
    return "; ".join(f"{err['loc'][-1]}: {err['msg']}" for err in exc.errors())


@router.get("/assignable-users", response_model=list[UserOut])
def list_assignable_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[User]:
    return db.query(User).filter(User.role == UserRole.SUPPORT).order_by(User.username).all()


@router.post("", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(
    title: str = Form(...),
    description: str = Form(...),
    category: TicketCategory = Form(TicketCategory.GENERAL),
    priority: TicketPriority = Form(TicketPriority.MEDIUM),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Ticket:
    try:
        payload = TicketCreate(title=title, description=description, category=category, priority=priority)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=_format_validation_error(exc),
        ) from exc

    attachment = save_upload(file) if file is not None else None
    return ticket_service.create_ticket(
        db,
        current_user,
        payload.title,
        payload.description,
        payload.category,
        payload.priority,
        attachment=attachment,
    )


@router.get("", response_model=list[TicketOut])
def list_my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Ticket]:
    return ticket_service.list_visible_tickets(db, current_user)


@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Ticket:
    return ticket_service.get_ticket_visible_to(db, ticket_id, current_user)


@router.put("/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: int,
    payload: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Ticket:
    ticket = ticket_service.get_ticket_or_404(db, ticket_id)
    return ticket_service.update_ticket(
        db,
        ticket,
        current_user,
        payload.title,
        payload.description,
        payload.category,
        payload.priority,
    )


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    ticket = ticket_service.get_ticket_or_404(db, ticket_id)
    ticket_service.delete_own_ticket(db, ticket, current_user)


@router.patch("/{ticket_id}/status", response_model=TicketOut)
def change_status(
    ticket_id: int,
    payload: TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Ticket:
    ticket = ticket_service.get_ticket_or_404(db, ticket_id)
    ticket_service.assert_can_change_status(ticket, current_user)
    return ticket_service.change_status(db, ticket, payload.status, current_user)


@router.patch("/{ticket_id}/assign", response_model=TicketOut)
def assign_ticket(
    ticket_id: int,
    payload: TicketAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Ticket:
    ticket = ticket_service.get_ticket_visible_to(db, ticket_id, current_user)
    return ticket_service.reassign_ticket(db, ticket, payload.assignee_id, current_user)


@router.post("/{ticket_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def add_comment(
    ticket_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = ticket_service.get_ticket_visible_to(db, ticket_id, current_user)
    return ticket_service.add_comment(db, ticket, current_user, payload.body)


@router.get("/{ticket_id}/attachment")
def download_attachment(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FileResponse:
    ticket = ticket_service.get_ticket_visible_to(db, ticket_id, current_user)
    if not ticket.attachment_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This ticket has no attachment")
    return FileResponse(
        UPLOAD_DIR / ticket.attachment_path,
        media_type=ticket.attachment_content_type or "application/octet-stream",
        filename=ticket.attachment_filename,
    )
