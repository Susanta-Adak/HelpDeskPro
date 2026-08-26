"""Populate the database with a demo admin, support users, and sample tickets.

Run with: python -m app.db.seed
"""

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.ticket import Ticket, TicketStatus
from app.models.user import User, UserRole


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Database already seeded, skipping.")
            return

        admin = User(username="admin", hashed_password=hash_password("admin123"), role=UserRole.ADMIN)
        alice = User(username="alice", hashed_password=hash_password("alice123"), role=UserRole.SUPPORT)
        bob = User(username="bob", hashed_password=hash_password("bob123"), role=UserRole.SUPPORT)
        db.add_all([admin, alice, bob])
        db.commit()
        db.refresh(alice)
        db.refresh(bob)

        tickets = [
            Ticket(
                title="Cannot log into my account",
                description="I get an 'invalid credentials' error even though my password is correct.",
                status=TicketStatus.OPEN,
                creator_id=alice.id,
            ),
            Ticket(
                title="Invoice shows wrong amount",
                description="My last invoice shows $200 but I was quoted $150 for the plan.",
                status=TicketStatus.IN_PROGRESS,
                creator_id=alice.id,
                assignee_id=bob.id,
            ),
            Ticket(
                title="Feature request: dark mode",
                description="It would be great to have a dark mode option in the settings page.",
                status=TicketStatus.CLOSED,
                creator_id=bob.id,
                assignee_id=bob.id,
            ),
        ]
        db.add_all(tickets)
        db.commit()
        print("Seeded database with demo admin, support users, and sample tickets.")
        print("  admin / admin123")
        print("  alice / alice123 (support)")
        print("  bob   / bob123   (support)")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
