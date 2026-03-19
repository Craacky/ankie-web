from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "0002_admin_monitoring"
down_revision = "0001_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "request_logs" not in existing_tables:
        op.create_table(
            "request_logs",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), index=True),
            sa.Column("ip", sa.String(length=64), index=True),
            sa.Column("method", sa.String(length=16), nullable=False),
            sa.Column("path", sa.String(length=512), nullable=False, index=True),
            sa.Column("status_code", sa.Integer(), nullable=False, index=True),
            sa.Column("duration_ms", sa.Integer(), nullable=False),
            sa.Column("request_id", sa.String(length=64), nullable=False, index=True),
            sa.Column("user_agent", sa.String(length=512)),
            sa.Column("created_at", sa.DateTime(), nullable=False, index=True),
        )
    if "user_flags" not in existing_tables:
        op.create_table(
            "user_flags",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), index=True),
            sa.Column("ip", sa.String(length=64), index=True),
            sa.Column("banned", sa.Boolean(), nullable=False, index=True, server_default=sa.text("1")),
            sa.Column("reason", sa.String(length=255)),
            sa.Column("expires_at", sa.DateTime(), index=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, index=True),
            sa.Column("created_by_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), index=True),
        )
    if "admin_actions" not in existing_tables:
        op.create_table(
            "admin_actions",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("admin_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), index=True),
            sa.Column("action", sa.String(length=64), nullable=False),
            sa.Column("target_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), index=True),
            sa.Column("target_ip", sa.String(length=64), index=True),
            sa.Column("reason", sa.String(length=255)),
            sa.Column("created_at", sa.DateTime(), nullable=False, index=True),
        )
    if "alerts" not in existing_tables:
        op.create_table(
            "alerts",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("kind", sa.String(length=64), nullable=False, index=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), index=True),
            sa.Column("ip", sa.String(length=64), index=True),
            sa.Column("window_seconds", sa.Integer(), nullable=False),
            sa.Column("count", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False, index=True),
            sa.Column("last_sent_at", sa.DateTime(), index=True),
        )


def downgrade() -> None:
    op.drop_table("alerts")
    op.drop_table("admin_actions")
    op.drop_table("user_flags")
    op.drop_table("request_logs")
