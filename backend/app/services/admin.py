from __future__ import annotations

import json
import logging
import urllib.request
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import AdminAction, Alert, RequestLog, Session as UserSession, UserFlag
from ..settings import (
    admin_telegram_ids,
    alert_error_threshold,
    alert_requests_threshold,
    alert_window_seconds,
    request_log_retention_days,
    telegram_admin_chat_id,
)

logger = logging.getLogger(__name__)


def is_admin_telegram_id(telegram_id: int | None) -> bool:
    if telegram_id is None:
        return False
    return telegram_id in admin_telegram_ids()


def resolve_user_id_from_session(db: Session, session_token: str) -> int | None:
    now = datetime.utcnow()
    return db.scalar(
        select(UserSession.user_id).where(
            UserSession.token == session_token, UserSession.expires_at > now
        )
    )


def is_banned(db: Session, user_id: int | None, ip: str | None) -> bool:
    now = datetime.utcnow()
    query = select(UserFlag.id).where(
        UserFlag.banned == True,  # noqa: E712
        (UserFlag.expires_at.is_(None)) | (UserFlag.expires_at > now),
    )
    if user_id is not None and ip:
        query = query.where((UserFlag.user_id == user_id) | (UserFlag.ip == ip))
    elif user_id is not None:
        query = query.where(UserFlag.user_id == user_id)
    elif ip:
        query = query.where(UserFlag.ip == ip)
    else:
        return False
    return db.scalar(query) is not None


def record_request_log(
    db: Session,
    *,
    user_id: int | None,
    ip: str | None,
    method: str,
    path: str,
    status_code: int,
    duration_ms: int,
    request_id: str,
    user_agent: str | None,
) -> None:
    db.add(
        RequestLog(
            user_id=user_id,
            ip=ip,
            method=method,
            path=path,
            status_code=status_code,
            duration_ms=duration_ms,
            request_id=request_id,
            user_agent=user_agent,
        )
    )
    db.commit()


def cleanup_request_logs(db: Session) -> None:
    cutoff = datetime.utcnow() - timedelta(days=request_log_retention_days())
    db.query(RequestLog).filter(RequestLog.created_at < cutoff).delete()
    db.commit()


def _send_telegram_alert(message: str) -> None:
    chat_id = telegram_admin_chat_id()
    if not chat_id:
        return
    token = None
    from ..settings import env_str

    token = env_str("TELEGRAM_BOT_TOKEN", "")
    if not token:
        logger.warning("Telegram alert skipped: TELEGRAM_BOT_TOKEN not configured")
        return
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = json.dumps({"chat_id": chat_id, "text": message}).encode("utf-8")
    request = urllib.request.Request(
        url, data=payload, headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(request, timeout=10):
            logger.info("Telegram alert sent: %s", message[:100])
            return
    except Exception as exc:
        logger.warning("Failed to send Telegram alert: %s", exc)


def _maybe_alert(
    db: Session,
    *,
    kind: str,
    user_id: int | None,
    ip: str | None,
    window_seconds: int,
    count: int,
) -> None:
    now = datetime.utcnow()
    last_alert = db.scalar(
        select(Alert)
        .where(
            Alert.kind == kind,
            Alert.user_id == user_id,
            Alert.ip == ip,
        )
        .order_by(Alert.created_at.desc())
    )
    if (
        last_alert
        and last_alert.last_sent_at
        and (now - last_alert.last_sent_at).total_seconds() < window_seconds
    ):
        return
    alert = Alert(
        kind=kind,
        user_id=user_id,
        ip=ip,
        window_seconds=window_seconds,
        count=count,
        created_at=now,
        last_sent_at=now,
    )
    db.add(alert)
    db.commit()
    target = f"user_id={user_id}" if user_id else f"ip={ip}"
    _send_telegram_alert(
        f"[ankie] {kind} threshold hit for {target}: {count} events/{window_seconds}s"
    )


def check_alerts(db: Session) -> None:
    window = alert_window_seconds()
    window_start = datetime.utcnow() - timedelta(seconds=window)

    req_threshold = alert_requests_threshold()
    err_threshold = alert_error_threshold()

    user_counts = db.execute(
        select(RequestLog.user_id, func.count(RequestLog.id))
        .where(RequestLog.user_id.is_not(None), RequestLog.created_at >= window_start)
        .group_by(RequestLog.user_id)
    ).all()
    for user_id, count in user_counts:
        if count >= req_threshold:
            _maybe_alert(
                db,
                kind="high_request_rate_user",
                user_id=user_id,
                ip=None,
                window_seconds=window,
                count=int(count),
            )

    ip_counts = db.execute(
        select(RequestLog.ip, func.count(RequestLog.id))
        .where(RequestLog.ip.is_not(None), RequestLog.created_at >= window_start)
        .group_by(RequestLog.ip)
    ).all()
    for ip, count in ip_counts:
        if count >= req_threshold:
            _maybe_alert(
                db,
                kind="high_request_rate_ip",
                user_id=None,
                ip=ip,
                window_seconds=window,
                count=int(count),
            )

    error_counts = db.execute(
        select(RequestLog.user_id, func.count(RequestLog.id))
        .where(
            RequestLog.user_id.is_not(None),
            RequestLog.status_code >= 500,
            RequestLog.created_at >= window_start,
        )
        .group_by(RequestLog.user_id)
    ).all()
    for user_id, count in error_counts:
        if count >= err_threshold:
            _maybe_alert(
                db,
                kind="high_error_rate_user",
                user_id=user_id,
                ip=None,
                window_seconds=window,
                count=int(count),
            )


def record_admin_action(
    db: Session,
    *,
    admin_user_id: int | None,
    action: str,
    target_user_id: int | None = None,
    target_ip: str | None = None,
    reason: str | None = None,
) -> None:
    db.add(
        AdminAction(
            admin_user_id=admin_user_id,
            action=action,
            target_user_id=target_user_id,
            target_ip=target_ip,
            reason=reason,
        )
    )
    db.commit()
