#!/usr/bin/env python3
"""Run database migrations before starting the application."""
import os
import sys
from pathlib import Path

from alembic import command
from alembic.config import Config


def run_migrations() -> None:
    """Run alembic migrations."""
    base_dir = Path(__file__).resolve().parent
    alembic_ini = base_dir / "alembic.ini"
    config = Config(str(alembic_ini))
    config.set_main_option("script_location", str(base_dir / "alembic"))
    db_path = os.getenv("DB_PATH", "/data/ankie.db")
    config.set_main_option("sqlalchemy.url", f"sqlite:///{db_path}")

    try:
        print("Starting database migrations...")
        command.upgrade(config, "head")
        print("Database migrations completed successfully")
    except Exception as exc:
        print(f"Migration failed: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    run_migrations()
