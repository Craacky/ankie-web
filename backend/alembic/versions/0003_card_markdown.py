from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0003_card_markdown"
down_revision = "0002_admin_monitoring"
branch_labels = None
depends_on = None


def _column_exists(inspector: sa.Inspector, table_name: str, column_name: str) -> bool:
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def _index_exists(inspector: sa.Inspector, table_name: str, index_name: str) -> bool:
    return any(index["name"] == index_name for index in inspector.get_indexes(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "cards" in inspector.get_table_names():
        if not _column_exists(inspector, "cards", "is_markdown"):
            op.add_column("cards", sa.Column("is_markdown", sa.Boolean(), nullable=False, server_default=sa.text("0")))

        if not _index_exists(inspector, "cards", "ix_cards_is_markdown"):
            op.create_index("ix_cards_is_markdown", "cards", ["is_markdown"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "cards" in inspector.get_table_names():
        if _index_exists(inspector, "cards", "ix_cards_is_markdown"):
            op.drop_index("ix_cards_is_markdown", table_name="cards")
        if _column_exists(inspector, "cards", "is_markdown"):
            op.drop_column("cards", "is_markdown")
