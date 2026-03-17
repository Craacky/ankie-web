from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_admin_user
from ..limiter import limiter
from ..models import Alert, RequestLog, User, UserFlag
from ..schemas import (
    AdminAlertOut,
    AdminBanIn,
    AdminMeOut,
    AdminOverviewOut,
    AdminRequestOut,
    AdminUnbanIn,
    AdminUserOut,
    MessageOut,
)
from ..services.admin import record_admin_action

router = APIRouter()


@router.get("/admin/me", response_model=AdminMeOut)
@limiter.limit("60/minute")
def admin_me(_: User = Depends(get_admin_user)) -> AdminMeOut:
    return AdminMeOut(is_admin=True)


@router.get("/admin/overview", response_model=AdminOverviewOut)
@limiter.limit("30/minute")
def admin_overview(
    window_minutes: int = Query(60, ge=1, le=1440),
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> AdminOverviewOut:
    window_start = datetime.utcnow() - timedelta(minutes=window_minutes)
    total_requests = db.scalar(select(func.count(RequestLog.id)).where(RequestLog.created_at >= window_start)) or 0
    unique_users = (
        db.scalar(select(func.count(func.distinct(RequestLog.user_id))).where(RequestLog.user_id.is_not(None), RequestLog.created_at >= window_start))
        or 0
    )
    unique_ips = (
        db.scalar(select(func.count(func.distinct(RequestLog.ip))).where(RequestLog.ip.is_not(None), RequestLog.created_at >= window_start))
        or 0
    )
    error_requests = (
        db.scalar(select(func.count(RequestLog.id)).where(RequestLog.status_code >= 500, RequestLog.created_at >= window_start))
        or 0
    )
    return AdminOverviewOut(
        window_minutes=window_minutes,
        total_requests=int(total_requests),
        unique_users=int(unique_users),
        unique_ips=int(unique_ips),
        error_requests=int(error_requests),
    )


@router.get("/admin/users", response_model=list[AdminUserOut])
@limiter.limit("30/minute")
def admin_users(
    window_minutes: int = Query(1440, ge=5, le=10080),
    limit: int = Query(100, ge=1, le=500),
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> list[AdminUserOut]:
    window_start = datetime.utcnow() - timedelta(minutes=window_minutes)
    stats = db.execute(
        select(
            RequestLog.user_id,
            func.count(RequestLog.id).label("request_count"),
            func.sum(case((RequestLog.status_code >= 500, 1), else_=0)).label("error_count"),
            func.max(RequestLog.created_at).label("last_seen"),
        )
        .where(RequestLog.user_id.is_not(None), RequestLog.created_at >= window_start)
        .group_by(RequestLog.user_id)
        .order_by(func.count(RequestLog.id).desc())
        .limit(limit)
    ).all()

    user_ids = [row.user_id for row in stats]
    users = {user.id: user for user in db.scalars(select(User).where(User.id.in_(user_ids))).all()}
    now = datetime.utcnow()
    banned_ids = {
        row[0]
        for row in db.execute(
            select(UserFlag.user_id).where(
                UserFlag.user_id.is_not(None),
                UserFlag.banned == True,  # noqa: E712
                (UserFlag.expires_at.is_(None)) | (UserFlag.expires_at > now),
            )
        ).all()
    }

    result: list[AdminUserOut] = []
    for row in stats:
        user = users.get(row.user_id)
        if not user:
            continue
        result.append(
            AdminUserOut(
                id=user.id,
                telegram_id=user.telegram_id,
                username=user.username,
                first_name=user.first_name,
                last_name=user.last_name,
                request_count=int(row.request_count or 0),
                error_count=int(row.error_count or 0),
                last_seen=row.last_seen,
                is_banned=user.id in banned_ids,
            )
        )
    return result


@router.get("/admin/requests", response_model=list[AdminRequestOut])
@limiter.limit("30/minute")
def admin_requests(
    user_id: int | None = None,
    ip: str | None = None,
    path_contains: str | None = None,
    status_min: int | None = None,
    limit: int = Query(200, ge=1, le=1000),
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> list[AdminRequestOut]:
    query = select(RequestLog).order_by(RequestLog.created_at.desc()).limit(limit)
    if user_id is not None:
        query = query.where(RequestLog.user_id == user_id)
    if ip:
        query = query.where(RequestLog.ip == ip)
    if path_contains:
        query = query.where(RequestLog.path.contains(path_contains))
    if status_min is not None:
        query = query.where(RequestLog.status_code >= status_min)

    rows = db.scalars(query).all()
    return [
        AdminRequestOut(
            id=row.id,
            user_id=row.user_id,
            ip=row.ip,
            method=row.method,
            path=row.path,
            status_code=row.status_code,
            duration_ms=row.duration_ms,
            request_id=row.request_id,
            user_agent=row.user_agent,
            created_at=row.created_at,
        )
        for row in rows
    ]


@router.post("/admin/ban", response_model=MessageOut)
@limiter.limit("20/minute")
def admin_ban(
    payload: AdminBanIn,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> MessageOut:
    if not payload.user_id and not payload.ip:
        raise HTTPException(status_code=400, detail="user_id or ip is required")
    expires_at = None
    if payload.duration_minutes:
        expires_at = datetime.utcnow() + timedelta(minutes=payload.duration_minutes)
    db.add(
        UserFlag(
            user_id=payload.user_id,
            ip=payload.ip,
            banned=True,
            reason=payload.reason,
            expires_at=expires_at,
            created_by_user_id=admin_user.id,
        )
    )
    db.commit()
    record_admin_action(
        db,
        admin_user_id=admin_user.id,
        action="ban",
        target_user_id=payload.user_id,
        target_ip=payload.ip,
        reason=payload.reason,
    )
    return MessageOut(message="Ban applied")


@router.post("/admin/unban", response_model=MessageOut)
@limiter.limit("20/minute")
def admin_unban(
    payload: AdminUnbanIn,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> MessageOut:
    if not payload.user_id and not payload.ip:
        raise HTTPException(status_code=400, detail="user_id or ip is required")
    query = db.query(UserFlag).filter(UserFlag.banned == True)  # noqa: E712
    if payload.user_id is not None:
        query = query.filter(UserFlag.user_id == payload.user_id)
    if payload.ip:
        query = query.filter(UserFlag.ip == payload.ip)
    updated = query.update({UserFlag.banned: False, UserFlag.expires_at: datetime.utcnow()})
    db.commit()
    record_admin_action(
        db,
        admin_user_id=admin_user.id,
        action="unban",
        target_user_id=payload.user_id,
        target_ip=payload.ip,
        reason="manual unban",
    )
    if not updated:
        return MessageOut(message="No matching ban found")
    return MessageOut(message="Ban removed")


@router.get("/admin/alerts", response_model=list[AdminAlertOut])
@limiter.limit("30/minute")
def admin_alerts(
    limit: int = Query(100, ge=1, le=500),
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> list[AdminAlertOut]:
    rows = db.scalars(select(Alert).order_by(Alert.created_at.desc()).limit(limit)).all()
    return [
        AdminAlertOut(
            id=row.id,
            kind=row.kind,
            user_id=row.user_id,
            ip=row.ip,
            window_seconds=row.window_seconds,
            count=row.count,
            created_at=row.created_at,
        )
        for row in rows
    ]
