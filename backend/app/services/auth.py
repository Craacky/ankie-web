from __future__ import annotations

import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Response
from sqlalchemy.orm import Session

from ..models import Session as UserSession
from ..models import User
from ..schemas import TelegramAuthPayload, UserOut
from ..settings import csrf_cookie_name, env_bool, env_int

SESSION_COOKIE_NAME = "ankie_session"


def verify_telegram_payload(payload: TelegramAuthPayload, bot_token: str) -> bool:
    data = payload.model_dump()
    incoming_hash = data.pop("hash")
    parts: list[str] = []
    for key in sorted(data.keys()):
        value = data[key]
        if value is None:
            continue
        parts.append(f"{key}={value}")
    data_check_string = "\n".join(parts)

    secret_key = hashlib.sha256(bot_token.encode("utf-8")).digest()
    expected_hash = hmac.new(
        secret_key, data_check_string.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected_hash, incoming_hash)


def user_to_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        telegram_id=user.telegram_id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        photo_url=user.photo_url,
        theme_key=user.theme_key,
    )


def create_session(db: Session, user_id: int) -> UserSession:
    ttl_days = env_int("SESSION_TTL_DAYS", 30)
    now = datetime.now(timezone.utc)
    session = UserSession(
        token=secrets.token_urlsafe(48),
        user_id=user_id,
        created_at=now,
        expires_at=now + timedelta(days=ttl_days),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def set_session_cookie(response: Response, token: str) -> None:
    ttl_days = env_int("SESSION_TTL_DAYS", 30)
    cookie_secure = env_bool("COOKIE_SECURE", False)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=cookie_secure,
        samesite="lax",
        max_age=ttl_days * 24 * 60 * 60,
        path="/",
    )


def set_csrf_cookie(response: Response, token: str | None = None) -> str:
    ttl_days = env_int("SESSION_TTL_DAYS", 30)
    cookie_secure = env_bool("COOKIE_SECURE", False)
    csrf_token = token or secrets.token_urlsafe(32)
    response.set_cookie(
        key=csrf_cookie_name(),
        value=csrf_token,
        httponly=False,
        secure=cookie_secure,
        samesite="strict",
        max_age=ttl_days * 24 * 60 * 60,
        path="/",
    )
    return csrf_token


def clear_session_cookie(response: Response) -> None:
    cookie_secure = env_bool("COOKIE_SECURE", False)
    response.delete_cookie(
        key=SESSION_COOKIE_NAME, path="/", samesite="lax", secure=cookie_secure
    )


def clear_csrf_cookie(response: Response) -> None:
    cookie_secure = env_bool("COOKIE_SECURE", False)
    response.delete_cookie(
        key=csrf_cookie_name(), path="/", samesite="strict", secure=cookie_secure
    )
