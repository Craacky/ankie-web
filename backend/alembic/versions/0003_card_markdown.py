from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0003_card_markdown"
down_revision = "0002_admin_monitoring"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("cards", sa.Column("is_markdown", sa.Boolean(), nullable=False, server_default=sa.text("0")))


def downgrade() -> None:
    op.drop_column("cards", "is_markdown")
