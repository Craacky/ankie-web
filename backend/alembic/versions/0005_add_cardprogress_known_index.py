"""add cardprogress known index

Revision ID: 0005
Revises: 0004_fix_legacy_schema
Create Date: 2026-04-01 07:52:59.674000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0005"
down_revision = "0004_fix_legacy_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Index already exists in model definition, skip creation
    pass


def downgrade() -> None:
    # Index managed by model, skip removal
    pass
