from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0003_card_markdown"
down_revision = "0002_admin_monitoring"
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


def downgrade() -> None:
    op.drop_column("cards", "is_markdown")
