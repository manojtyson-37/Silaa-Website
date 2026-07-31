"""add payment_mode to sales_order and create proforma_invoice tables

Revision ID: h6i7j8k9l0m1
Revises: bd93c6cd7822
Create Date: 2026-08-01

"""
from alembic import op
import sqlalchemy as sa

revision = 'h6i7j8k9l0m1'
down_revision = 'bd93c6cd7822'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add payment_mode to sales_order
    op.add_column(
        'sales_order',
        sa.Column('payment_mode', sa.String(), nullable=True),
    )

    # Create proforma_invoice table
    op.create_table(
        'proforma_invoice',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('invoice_number', sa.String(), nullable=True, unique=True),
        sa.Column('customer_name', sa.String(), nullable=False),
        sa.Column('customer_phone', sa.String(), nullable=True),
        sa.Column('customer_email', sa.String(), nullable=True),
        sa.Column('customer_address', sa.String(), nullable=True),
        sa.Column('customer_gstin', sa.String(), nullable=True),
        sa.Column('customer_state', sa.String(), nullable=True),
        sa.Column('delivery_date', sa.Date(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('terms_and_conditions', sa.Text(), nullable=True),
        sa.Column('advance_percent', sa.Numeric(5, 2), nullable=False, server_default='50'),
        sa.Column('status', sa.String(), nullable=False, server_default='draft'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # Create proforma_invoice_line table
    op.create_table(
        'proforma_invoice_line',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('proforma_id', sa.Integer(), sa.ForeignKey('proforma_invoice.id'), nullable=False),
        sa.Column('style_name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('photo_url', sa.String(), nullable=True),
        sa.Column('unit_price', sa.Numeric(12, 2), nullable=False),
        sa.Column('sizes', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('total_qty', sa.Numeric(12, 2), nullable=False, server_default='0'),
    )


def downgrade() -> None:
    op.drop_table('proforma_invoice_line')
    op.drop_table('proforma_invoice')
    op.drop_column('sales_order', 'payment_mode')
