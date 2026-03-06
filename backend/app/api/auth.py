from __future__ import annotations

import os
from datetime import datetime

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import Collection, User, Session as UserSession
from ..schemas import AuthConfigOut, MessageOut, TelegramAuthPayload, UserOut, UserThemeUpdate
from ..services.auth import (
    SESSION_COOKIE_NAME,
    clear_session_cookie,
    create_session,
    set_session_cookie,
    user_to_out,
    verify_telegram_payload,
)
from ..services.imports import ensure_user_sources_loaded, maybe_assign_legacy_data_to_first_user
from ..services.notes import bootstrap_notes_from_github

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

    claim_result = db.execute(
        update(User)
        .where(User.id == user.id, User.auto_import_done == False)  # noqa: E712
        .values(auto_import_done=True)
    )
    db.commit()
    db.refresh(user)
    should_auto_import = (claim_result.rowcount or 0) > 0
    if should_auto_import:
        existing_count = db.scalar(select(func.count(Collection.id)).where(Collection.user_id == user.id)) or 0
        if existing_count == 0:
            ensure_user_sources_loaded(db, user)

    notes_claim_result = db.execute(
        update(User)
        .where(User.id == user.id, User.notes_bootstrap_done == False)  # noqa: E712
        .values(notes_bootstrap_done=True)
    )
    db.commit()
    db.refresh(user)
    should_bootstrap_notes = (notes_claim_result.rowcount or 0) > 0
    if should_bootstrap_notes:
        bootstrap_ok = False
        try:
            bootstrap_ok = bootstrap_notes_from_github(user)
        except Exception:  # noqa: BLE001
            bootstrap_ok = False
        if not bootstrap_ok:
            user.notes_bootstrap_done = False
            db.commit()
            db.refresh(user)

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
