"""Bootstrap the database with the initial admin account.

Requires SEED_ADMIN_PASSWORD to be set (via .env — see .env.example). There
is no hardcoded fallback: this refuses to run without it so a real password
never ends up in source. From there, log in as the admin and use the Users
page (or POST /admin/users) to create support/admin accounts and start
creating tickets — nothing else is pre-seeded.

Run with: python -m app.db.seed
"""

from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.user import User, UserRole


def seed() -> None:
    if not settings.seed_admin_password:
        raise RuntimeError(
            "SEED_ADMIN_PASSWORD must be set (copy backend/.env.example to "
            "backend/.env and fill it in) before seeding."
        )

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Database already seeded, skipping.")
            return

        admin = User(
            username=settings.seed_admin_username,
            hashed_password=hash_password(settings.seed_admin_password),
            role=UserRole.ADMIN,
        )
        db.add(admin)
        db.commit()

        print(f"Seeded database with the initial admin account: {admin.username} / <SEED_ADMIN_PASSWORD>")
        print("Log in and use the Users page to create support/admin accounts.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
