"""add cardprogress known index

Revision ID: 0005
Revises: 0004
Create Date: 2026-04-01 07:52:59.674000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add index on CardProgress.known for better query performance
    with op.batch_alter_table("card_progress", schema=None) as batch_op:
        batch_op.create_index("ix_card_progress_known", ["known"], unique=False)


def downgrade() -> None:
    # Remove index on CardProgress.known
    with op.batch_alter_table("card_progress", schema=None) as batch_op:
        batch_op.drop_index("ix_card_progress_known")
