from __future__ import annotations

from datetime import datetime

from fastapi import Cookie, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, joinedload

from .database import get_db
from .models import Session as UserSession
from .models import User
from .services.auth import SESSION_COOKIE_NAME
from .settings import session_cleanup_interval_seconds

_last_session_cleanup_at = datetime.min


def _maybe_cleanup_expired_sessions(db: Session, now: datetime) -> None:
    global _last_session_cleanup_at
    interval = session_cleanup_interval_seconds()
    if (now - _last_session_cleanup_at).total_seconds() < interval:
        return
    db.execute(delete(UserSession).where(UserSession.expires_at <= now))
    db.commit()
    _last_session_cleanup_at = now


def get_current_user(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    db: Session = Depends(get_db),
) -> User:
    if not session_token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    now = datetime.utcnow()
    session = db.scalar(
        select(UserSession)
        .where(UserSession.token == session_token, UserSession.expires_at > now)
        .options(joinedload(UserSession.user))
    )
    if not session or not session.user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    _maybe_cleanup_expired_sessions(db, now)
    return session.user
