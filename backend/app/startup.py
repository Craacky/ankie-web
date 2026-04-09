from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime, timezone

from sqlalchemy import delete

from .database import SessionLocal, Base, engine
from .models import Session as UserSession
from .services.admin import check_alerts, cleanup_request_logs
from .settings import alert_check_interval_seconds, session_cleanup_interval_seconds

logger = logging.getLogger(__name__)


def validate_required_env_vars() -> None:
    """Validate required environment variables at startup."""
    required_vars = {
        "TELEGRAM_BOT_TOKEN": "Telegram bot token for authentication",
        "TELEGRAM_BOT_USERNAME": "Telegram bot username for authentication",
    }

    missing = []
    for var, description in required_vars.items():
        value = os.getenv(var, "").strip()
        if not value:
            missing.append(f"{var} ({description})")

    if missing:
        error_msg = "Missing required environment variables:\n" + "\n".join(
            f"  - {v}" for v in missing
        )
        logger.error(error_msg)
        raise RuntimeError(error_msg)

    logger.info("All required environment variables are set")


def init_database() -> None:
    """Initialize database by creating all tables."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as exc:
        logger.error("Database initialization failed: %s", exc, exc_info=True)
        raise RuntimeError(f"Database initialization failed: {exc}") from exc


async def session_cleanup_loop() -> None:
    try:
        while True:
            await asyncio.sleep(session_cleanup_interval_seconds())
            try:
                with SessionLocal() as db:
                    now = datetime.now(timezone.utc)
                    db.execute(delete(UserSession).where(UserSession.expires_at <= now))
                    db.commit()
            except Exception as exc:
                logger.error("Error in session cleanup loop: %s", exc, exc_info=True)
    except asyncio.CancelledError:
        logger.info("Session cleanup loop cancelled")
        return


async def admin_monitor_loop() -> None:
    try:
        while True:
            await asyncio.sleep(alert_check_interval_seconds())
            try:
                with SessionLocal() as db:
                    cleanup_request_logs(db)
                    check_alerts(db)
            except Exception as exc:
                logger.error("Error in admin monitor loop: %s", exc, exc_info=True)
    except asyncio.CancelledError:
        logger.info("Admin monitor loop cancelled")
        return
