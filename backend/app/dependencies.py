from __future__ import annotations

from fastapi import Cookie, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from .database import get_db
from .models import Session as UserSession
from .models import User
from .services.auth import SESSION_COOKIE_NAME


def get_current_user(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    db: Session = Depends(get_db),
) -> User:
    if not session_token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    from datetime import datetime

    now = datetime.utcnow()
    session = db.scalar(
        select(UserSession)
        .where(UserSession.token == session_token, UserSession.expires_at > now)
        .options(joinedload(UserSession.user))
    )
    if not session or not session.user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return session.user
