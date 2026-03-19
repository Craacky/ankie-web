from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0004_fix_legacy_schema"
down_revision = "0003_card_markdown"
branch_labels = None
depends_on = None


def _column_exists(inspector: sa.Inspector, table_name: str, column_name: str) -> bool:
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "cards" in inspector.get_table_names():
        if not _column_exists(inspector, "cards", "is_markdown"):
            op.add_column("cards", sa.Column("is_markdown", sa.Boolean(), nullable=False, server_default=sa.text("0")))

    if "card_progress" in inspector.get_table_names():
        if not _column_exists(inspector, "card_progress", "known"):
            op.add_column("card_progress", sa.Column("known", sa.Boolean(), nullable=False, server_default=sa.text("0")))
        if not _column_exists(inspector, "card_progress", "last_reviewed_at"):
            op.add_column("card_progress", sa.Column("last_reviewed_at", sa.DateTime(), nullable=True))
        if not _column_exists(inspector, "card_progress", "known_at"):
            op.add_column("card_progress", sa.Column("known_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    # Best-effort: SQLite doesn't reliably support DROP COLUMN across all versions.
    # Leave columns in place to avoid breaking existing data.
    pass
