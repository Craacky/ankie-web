from __future__ import annotations

from alembic import op
import sqlalchemy as sa

from app.database import Base

revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None


def _column_exists(inspector: sa.Inspector, table_name: str, column_name: str) -> bool:
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def _index_exists(inspector: sa.Inspector, table_name: str, index_name: str) -> bool:
    return any(index["name"] == index_name for index in inspector.get_indexes(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)

    inspector = sa.inspect(bind)

    if "users" in inspector.get_table_names():
        if _column_exists(inspector, "users", "auto_import_done"):
            with op.batch_alter_table("users") as batch:
                batch.drop_column("auto_import_done")
        if _column_exists(inspector, "users", "notes_bootstrap_done"):
            with op.batch_alter_table("users") as batch:
                batch.drop_column("notes_bootstrap_done")

    if "sessions" in inspector.get_table_names() and not _index_exists(inspector, "sessions", "ix_sessions_expires_at"):
        op.create_index("ix_sessions_expires_at", "sessions", ["expires_at"])

    if "collections" in inspector.get_table_names():
        if not _index_exists(inspector, "collections", "ix_collections_user_created_at"):
            op.create_index("ix_collections_user_created_at", "collections", ["user_id", "created_at"])
        if not _index_exists(inspector, "collections", "ix_collections_user_folder"):
            op.create_index("ix_collections_user_folder", "collections", ["user_id", "folder_id"])

    if "cards" in inspector.get_table_names() and not _index_exists(inspector, "cards", "ix_cards_collection_created_at"):
        op.create_index("ix_cards_collection_created_at", "cards", ["collection_id", "created_at"])

    if "card_progress" in inspector.get_table_names() and not _index_exists(inspector, "card_progress", "ix_card_progress_known_card"):
        op.create_index("ix_card_progress_known_card", "card_progress", ["known", "card_id"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "card_progress" in inspector.get_table_names() and _index_exists(inspector, "card_progress", "ix_card_progress_known_card"):
        op.drop_index("ix_card_progress_known_card", table_name="card_progress")
    if "cards" in inspector.get_table_names() and _index_exists(inspector, "cards", "ix_cards_collection_created_at"):
        op.drop_index("ix_cards_collection_created_at", table_name="cards")
    if "collections" in inspector.get_table_names():
        if _index_exists(inspector, "collections", "ix_collections_user_folder"):
            op.drop_index("ix_collections_user_folder", table_name="collections")
        if _index_exists(inspector, "collections", "ix_collections_user_created_at"):
            op.drop_index("ix_collections_user_created_at", table_name="collections")
    if "sessions" in inspector.get_table_names() and _index_exists(inspector, "sessions", "ix_sessions_expires_at"):
        op.drop_index("ix_sessions_expires_at", table_name="sessions")
