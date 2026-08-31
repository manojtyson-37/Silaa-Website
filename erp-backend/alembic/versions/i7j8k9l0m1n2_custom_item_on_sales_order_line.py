"""custom item on sales order line

Revision ID: i7j8k9l0m1n2
Revises: 2619bd60e9a3
Create Date: 2026-08-31

"""
from alembic import op
import sqlalchemy as sa

revision = "i7j8k9l0m1n2"
down_revision = "a2b3c4d5e6f7"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("sales_order_line", sa.Column("custom_item_name", sa.String(), nullable=True))
    op.add_column("sales_order_line", sa.Column("custom_item_notes", sa.String(), nullable=True))
    # Make variant_id nullable to allow custom (non-catalog) line items
    op.alter_column("sales_order_line", "variant_id", existing_type=sa.Integer(), nullable=True)


def downgrade():
    op.drop_column("sales_order_line", "custom_item_notes")
    op.drop_column("sales_order_line", "custom_item_name")
    op.alter_column("sales_order_line", "variant_id", existing_type=sa.Integer(), nullable=False)
