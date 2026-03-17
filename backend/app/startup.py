from __future__ import annotations

import asyncio
import os
from datetime import datetime
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import delete

from .database import SessionLocal
from .models import Session as UserSession
from .settings import session_cleanup_interval_seconds

def run_migrations() -> None:
    base_dir = Path(__file__).resolve().parents[1]
    alembic_ini = base_dir / "alembic.ini"
    config = Config(str(alembic_ini))
    config.set_main_option("script_location", str(base_dir / "alembic"))
    db_path = os.getenv("DB_PATH", "/data/ankie.db")
    config.set_main_option("sqlalchemy.url", f"sqlite:///{db_path}")
    command.upgrade(config, "head")


async def session_cleanup_loop() -> None:
    try:
        while True:
            await asyncio.sleep(session_cleanup_interval_seconds())
            with SessionLocal() as db:
                now = datetime.utcnow()
                db.execute(delete(UserSession).where(UserSession.expires_at <= now))
                db.commit()
    except asyncio.CancelledError:
        return
