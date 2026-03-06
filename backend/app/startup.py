from __future__ import annotations

import logging

from sqlalchemy import text

from .database import Base, engine

logger = logging.getLogger(__name__)


def run_startup_migrations() -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        users_columns = {row[1] for row in conn.execute(text("PRAGMA table_info(users)"))}
        if "auto_import_done" not in users_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN auto_import_done BOOLEAN DEFAULT 0"))
        if "notes_bootstrap_done" not in users_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN notes_bootstrap_done BOOLEAN DEFAULT 0"))
        if "theme_key" not in users_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN theme_key VARCHAR(64)"))

        collections_columns = {row[1] for row in conn.execute(text("PRAGMA table_info(collections)"))}
        if "folder_id" not in collections_columns:
            conn.execute(text("ALTER TABLE collections ADD COLUMN folder_id INTEGER"))
        if "user_id" not in collections_columns:
            conn.execute(text("ALTER TABLE collections ADD COLUMN user_id INTEGER"))

        folders_columns = {row[1] for row in conn.execute(text("PRAGMA table_info(folders)"))}
        if "user_id" not in folders_columns:
            conn.execute(text("ALTER TABLE folders ADD COLUMN user_id INTEGER"))

        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_collections_user_created_at ON collections (user_id, created_at)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_collections_user_folder ON collections (user_id, folder_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_cards_collection_created_at ON cards (collection_id, created_at)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_card_progress_known_card ON card_progress (known, card_id)"))

        # Data integrity for concurrent writes and race-safe unique names per user.
        try:
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_folders_user_name ON folders (user_id, name)"))
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_collections_user_name ON collections (user_id, name)"))
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to create unique user-name indexes: %s", exc)
