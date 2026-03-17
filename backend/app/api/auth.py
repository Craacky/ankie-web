from __future__ import annotations

import os
from datetime import datetime

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import User, Session as UserSession
from ..schemas import AuthConfigOut, MessageOut, TelegramAuthPayload, UserOut, UserThemeUpdate
from ..services.auth import (
    SESSION_COOKIE_NAME,
    clear_session_cookie,
    create_session,
    set_session_cookie,
    user_to_out,
    verify_telegram_payload,
)
from ..services.imports import maybe_assign_legacy_data_to_first_user

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/auth/config", response_model=AuthConfigOut)
def auth_config() -> AuthConfigOut:
    username = os.getenv("TELEGRAM_BOT_USERNAME", "").strip()
    if not username:
        raise HTTPException(status_code=500, detail="TELEGRAM_BOT_USERNAME is not configured")
    return AuthConfigOut(telegram_bot_username=username)


@router.post("/auth/telegram", response_model=UserOut)
def auth_telegram(payload: TelegramAuthPayload, response: Response, db: Session = Depends(get_db)) -> UserOut:
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    if not bot_token:
        raise HTTPException(status_code=500, detail="TELEGRAM_BOT_TOKEN is not configured")

    if not verify_telegram_payload(payload, bot_token):
        raise HTTPException(status_code=401, detail="Invalid Telegram signature")

    max_age_seconds = int(os.getenv("TELEGRAM_AUTH_MAX_AGE", str(24 * 60 * 60)))
    now_ts = int(datetime.utcnow().timestamp())
    if int(payload.auth_date) > now_ts + 60:
        raise HTTPException(status_code=401, detail="Telegram auth date is in the future")
    if now_ts - int(payload.auth_date) > max_age_seconds:
        raise HTTPException(status_code=401, detail="Telegram auth data is too old")

    user = db.scalar(select(User).where(User.telegram_id == payload.id))
    if not user:
        user = User(
            telegram_id=payload.id,
            username=payload.username,
            first_name=payload.first_name,
            last_name=payload.last_name,
            photo_url=payload.photo_url,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.username = payload.username
        user.first_name = payload.first_name
        user.last_name = payload.last_name
        user.photo_url = payload.photo_url
        db.commit()
        db.refresh(user)

    maybe_assign_legacy_data_to_first_user(db, user)

    session = create_session(db, user.id)
    set_session_cookie(response, session.token)
    return user_to_out(user)


@router.get("/auth/me", response_model=UserOut)
def auth_me(current_user: User = Depends(get_current_user)) -> UserOut:
    return user_to_out(current_user)


@router.put("/users/theme", response_model=UserOut)
def update_user_theme(
    payload: UserThemeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    theme_key = payload.theme_key.strip()
    if not theme_key:
        raise HTTPException(status_code=400, detail="theme_key cannot be empty")
    current_user.theme_key = theme_key
    db.commit()
    db.refresh(current_user)
    return user_to_out(current_user)


@router.post("/auth/logout", response_model=MessageOut)
def auth_logout(
    response: Response,
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    db: Session = Depends(get_db),
) -> MessageOut:
    if session_token:
        session = db.scalar(select(UserSession).where(UserSession.token == session_token))
        if session:
            db.delete(session)
            db.commit()
    clear_session_cookie(response)
    return MessageOut(message="Logged out")
