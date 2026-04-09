from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime, timezone
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import delete

from .database import SessionLocal
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


def run_migrations() -> None:
    base_dir = Path(__file__).resolve().parents[1]
    alembic_ini = base_dir / "alembic.ini"
    config = Config(str(alembic_ini))
    config.set_main_option("script_location", str(base_dir / "alembic"))
    db_path = os.getenv("DB_PATH", "/data/ankie.db")
    config.set_main_option("sqlalchemy.url", f"sqlite:///{db_path}")

    try:
        logger.info("Starting database migrations...")
        command.upgrade(config, "head")
        logger.info("Database migrations completed successfully")
    except Exception as exc:
        logger.error("Migration failed: %s", exc, exc_info=True)
        raise RuntimeError(f"Database migration failed: {exc}") from exc


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
