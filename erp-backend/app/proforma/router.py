from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.expenses.models import CompanySetting
from app.proforma.models import ProformaInvoice, ProformaInvoiceLine, ProformaStatus

router = APIRouter(tags=["proforma"])

DEFAULT_TERMS = """1. 50% advance payment required before production commences.
2. Balance payment to be made before or at the time of delivery.
3. Any changes to design/specifications after advance payment may incur additional charges.
4. Delivery timeline starts from the date of receipt of advance payment and materials.
5. Client-provided fabric/materials remain the property of the client.
6. Minor alterations (if any) within 7 days of delivery at no extra charge.
7. This proforma invoice is valid for 15 days from the date of issue."""


# ── Schemas ─────────────────────────────────────────────────────────────────

class LineSizeIn(BaseModel):
    S: Optional[int] = 0
    M: Optional[int] = 0
    L: Optional[int] = 0
    XL: Optional[int] = 0
    XXL: Optional[int] = 0


class ProformaLineIn(BaseModel):
    style_name: str
    description: Optional[str] = None
    photo_url: Optional[str] = None
    unit_price: Decimal
    sizes: dict  # {"S": 10, "M": 20, ...}


class ProformaIn(BaseModel):
    customer_name: str
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    customer_address: Optional[str] = None
    customer_gstin: Optional[str] = None
    customer_state: Optional[str] = None
    delivery_date: Optional[date] = None
    description: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    advance_percent: Decimal = Decimal("50")
    lines: list[ProformaLineIn]


class ProformaLineOut(BaseModel):
    id: int
    style_name: str
    description: Optional[str]
    photo_url: Optional[str]
    unit_price: Decimal
    sizes: dict
    total_qty: Decimal
    line_total: Decimal

    model_config = {"from_attributes": True}


class ProformaOut(BaseModel):
    id: int
    invoice_number: Optional[str]
    customer_name: str
    customer_phone: Optional[str]
    customer_email: Optional[str]
    customer_address: Optional[str]
    customer_gstin: Optional[str]
    customer_state: Optional[str]
    delivery_date: Optional[date]
    description: Optional[str]
    terms_and_conditions: Optional[str]
    advance_percent: Decimal
    status: str
    created_at: datetime
    lines: list[ProformaLineOut] = []
    total_amount: Decimal = Decimal("0")
    advance_amount: Decimal = Decimal("0")
    balance_amount: Decimal = Decimal("0")

    model_config = {"from_attributes": True}


class ProformaUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    customer_address: Optional[str] = None
    customer_gstin: Optional[str] = None
    customer_state: Optional[str] = None
    delivery_date: Optional[date] = None
    description: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    advance_percent: Optional[Decimal] = None
    lines: Optional[list[ProformaLineIn]] = None


class StatusTransitionIn(BaseModel):
    status: ProformaStatus


# ── Helpers ──────────────────────────────────────────────────────────────────

def _compute_line(line: ProformaInvoiceLine) -> ProformaLineOut:
    sizes = line.sizes or {}
    total_qty = Decimal(str(sum(v for v in sizes.values() if isinstance(v, (int, float)))))
    line_total = total_qty * line.unit_price
    return ProformaLineOut(
        id=line.id,
        style_name=line.style_name,
        description=line.description,
        photo_url=line.photo_url,
        unit_price=line.unit_price,
        sizes=sizes,
        total_qty=total_qty,
        line_total=line_total,
    )


def _enrich(pi: ProformaInvoice, lines: list[ProformaInvoiceLine]) -> ProformaOut:
    line_outs = [_compute_line(l) for l in lines]
    total = sum(lo.line_total for lo in line_outs)
    advance = (total * pi.advance_percent / Decimal("100")).quantize(Decimal("0.01"))
    return ProformaOut(
        id=pi.id,
        invoice_number=pi.invoice_number,
        customer_name=pi.customer_name,
        customer_phone=pi.customer_phone,
        customer_email=pi.customer_email,
        customer_address=pi.customer_address,
        customer_gstin=pi.customer_gstin,
        customer_state=pi.customer_state,
        delivery_date=pi.delivery_date,
        description=pi.description,
        terms_and_conditions=pi.terms_and_conditions,
        advance_percent=pi.advance_percent,
        status=pi.status,
        created_at=pi.created_at,
        lines=line_outs,
        total_amount=total,
        advance_amount=advance,
        balance_amount=total - advance,
    )


def _save_lines(db: Session, proforma_id: int, lines_in: list[ProformaLineIn]) -> list[ProformaInvoiceLine]:
    db.query(ProformaInvoiceLine).filter_by(proforma_id=proforma_id).delete()
    saved = []
    for l in lines_in:
        sizes = {k: int(v) for k, v in l.sizes.items() if isinstance(v, (int, float)) and int(v) > 0}
        total_qty = sum(sizes.values())
        line = ProformaInvoiceLine(
            proforma_id=proforma_id,
            style_name=l.style_name,
            description=l.description,
            photo_url=l.photo_url,
            unit_price=l.unit_price,
            sizes=sizes,
            total_qty=Decimal(str(total_qty)),
        )
        db.add(line)
        saved.append(line)
    db.flush()
    return saved


_TRANSITIONS: dict[str, set[str]] = {
    ProformaStatus.DRAFT.value:        {ProformaStatus.SENT.value, ProformaStatus.CANCELLED.value},
    ProformaStatus.SENT.value:         {ProformaStatus.ADVANCE_PAID.value, ProformaStatus.CANCELLED.value, ProformaStatus.DRAFT.value},
    ProformaStatus.ADVANCE_PAID.value: {ProformaStatus.BALANCE_PAID.value, ProformaStatus.CANCELLED.value},
    ProformaStatus.BALANCE_PAID.value: {ProformaStatus.COMPLETED.value},
    ProformaStatus.COMPLETED.value:    set(),
    ProformaStatus.CANCELLED.value:    {ProformaStatus.DRAFT.value},
}

# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/proforma-invoices", response_model=ProformaOut, status_code=201)
def create_proforma(payload: ProformaIn, db: Session = Depends(get_db)):
    if not payload.lines:
        raise HTTPException(400, "At least one line item required")
    setting = db.get(CompanySetting, "proforma_terms")
    default_terms = setting.value if setting else DEFAULT_TERMS
    pi = ProformaInvoice(
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_email=payload.customer_email,
        customer_address=payload.customer_address,
        customer_gstin=payload.customer_gstin,
        customer_state=payload.customer_state,
        delivery_date=payload.delivery_date,
        description=payload.description,
        terms_and_conditions=payload.terms_and_conditions or default_terms,
        advance_percent=payload.advance_percent,
        status=ProformaStatus.DRAFT.value,
    )
    db.add(pi)
    db.flush()
    pi.invoice_number = f"PI-{pi.id:04d}"
    lines = _save_lines(db, pi.id, payload.lines)
    db.commit()
    db.refresh(pi)
    return _enrich(pi, lines)


@router.get("/proforma-invoices", response_model=list[ProformaOut])
def list_proformas(db: Session = Depends(get_db)):
    pis = db.scalars(select(ProformaInvoice).order_by(ProformaInvoice.id.desc())).all()
    all_lines = db.scalars(select(ProformaInvoiceLine)).all()
    lines_by_pi: dict[int, list[ProformaInvoiceLine]] = {}
    for l in all_lines:
        lines_by_pi.setdefault(l.proforma_id, []).append(l)
    return [_enrich(pi, lines_by_pi.get(pi.id, [])) for pi in pis]


@router.get("/proforma-invoices/{pi_id}", response_model=ProformaOut)
def get_proforma(pi_id: int, db: Session = Depends(get_db)):
    pi = db.get(ProformaInvoice, pi_id)
    if not pi:
        raise HTTPException(404, "Proforma invoice not found")
    lines = db.scalars(select(ProformaInvoiceLine).filter_by(proforma_id=pi_id)).all()
    return _enrich(pi, list(lines))


@router.patch("/proforma-invoices/{pi_id}", response_model=ProformaOut)
def update_proforma(pi_id: int, payload: ProformaUpdate, db: Session = Depends(get_db)):
    pi = db.get(ProformaInvoice, pi_id)
    if not pi:
        raise HTTPException(404, "Proforma invoice not found")
    if pi.status not in (ProformaStatus.DRAFT.value, ProformaStatus.SENT.value):
        raise HTTPException(400, "Can only edit proforma in Draft or Sent status")
    data = payload.model_dump(exclude_unset=True)
    lines_in = data.pop("lines", None)
    for k, v in data.items():
        setattr(pi, k, v)
    if lines_in is not None:
        if not lines_in:
            raise HTTPException(400, "Lines cannot be empty")
        lines = _save_lines(db, pi_id, [ProformaLineIn(**l) for l in lines_in])
    else:
        lines = list(db.scalars(select(ProformaInvoiceLine).filter_by(proforma_id=pi_id)).all())
    db.commit()
    db.refresh(pi)
    return _enrich(pi, lines)


@router.post("/proforma-invoices/{pi_id}/status", response_model=ProformaOut)
def update_status(pi_id: int, payload: StatusTransitionIn, db: Session = Depends(get_db)):
    pi = db.get(ProformaInvoice, pi_id)
    if not pi:
        raise HTTPException(404, "Proforma invoice not found")

    allowed = _TRANSITIONS.get(pi.status, set())
    if payload.status.value not in allowed:
        raise HTTPException(400, f"Cannot move from '{pi.status}' to '{payload.status.value}'")
    pi.status = payload.status.value
    db.commit()
    db.refresh(pi)
    lines = list(db.scalars(select(ProformaInvoiceLine).filter_by(proforma_id=pi_id)).all())
    return _enrich(pi, lines)


@router.delete("/proforma-invoices/{pi_id}", status_code=204)
def delete_proforma(pi_id: int, db: Session = Depends(get_db)):
    pi = db.get(ProformaInvoice, pi_id)
    if not pi:
        raise HTTPException(404, "Proforma invoice not found")
    if pi.status not in (ProformaStatus.DRAFT.value, ProformaStatus.CANCELLED.value):
        raise HTTPException(400, "Can only delete Draft or Cancelled proforma invoices")
    try:
        db.query(ProformaInvoiceLine).filter_by(proforma_id=pi_id).delete()
        db.delete(pi)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Delete failed: {e}")
