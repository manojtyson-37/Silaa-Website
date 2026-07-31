import enum
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, JSON, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class ProformaStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    ADVANCE_PAID = "advance_paid"
    BALANCE_PAID = "balance_paid"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ProformaInvoice(Base):
    __tablename__ = "proforma_invoice"

    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_number: Mapped[str] = mapped_column(String, nullable=True, unique=True)
    customer_name: Mapped[str] = mapped_column(String, nullable=False)
    customer_phone: Mapped[str] = mapped_column(String, nullable=True)
    customer_email: Mapped[str] = mapped_column(String, nullable=True)
    customer_address: Mapped[str] = mapped_column(String, nullable=True)
    customer_gstin: Mapped[str] = mapped_column(String, nullable=True)
    customer_state: Mapped[str] = mapped_column(String, nullable=True)
    delivery_date: Mapped[date] = mapped_column(Date, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    terms_and_conditions: Mapped[str] = mapped_column(Text, nullable=True)
    advance_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, server_default="50")
    status: Mapped[str] = mapped_column(String, nullable=False, server_default=ProformaStatus.DRAFT.value)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ProformaInvoiceLine(Base):
    __tablename__ = "proforma_invoice_line"

    id: Mapped[int] = mapped_column(primary_key=True)
    proforma_id: Mapped[int] = mapped_column(ForeignKey("proforma_invoice.id"), nullable=False)
    style_name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)
    photo_url: Mapped[str] = mapped_column(String, nullable=True)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    sizes: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    total_qty: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, server_default="0")
