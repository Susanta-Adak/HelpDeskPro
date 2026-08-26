from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User, UserRole


def list_users(db: Session) -> list[User]:
    return db.query(User).order_by(User.username).all()


def get_user_or_404(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def set_user_active(db: Session, target: User, actor: User, is_active: bool) -> User:
    if target.id == actor.id and not is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account",
        )
    target.is_active = is_active
    db.commit()
    db.refresh(target)
    return target


def create_user(db: Session, username: str, password: str, role: UserRole) -> User:
    existing = db.query(User).filter(User.username == username).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That username is already taken",
        )

    user = User(username=username, hashed_password=hash_password(password), role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
