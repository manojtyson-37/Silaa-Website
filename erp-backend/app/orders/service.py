from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.ledger_base import Direction
from app.finished_goods.service import fg_balance, record_movement
from app.orders.models import SalesOrder, SalesOrderLine, SalesOrderStatus


class InsufficientStockError(Exception):
    pass

def restore_sanity_campaign(campaign_id: str):
    import os
    import httpx
    
    project_id = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID")
    dataset = os.environ.get("NEXT_PUBLIC_SANITY_DATASET", "production")
    token = os.environ.get("SANITY_API_WRITE_TOKEN")

    if not project_id or not token:
        print(f"Skipping campaign restoration for {campaign_id}: Sanity credentials not configured.")
        return

    url = f"https://{project_id}.api.sanity.io/v2023-01-01/data/mutate/{dataset}"
    payload = {
        "mutations": [
            {
                "patch": {
                    "id": campaign_id,
                    "set": {
                        "isActive": True
                    },
                    "dec": {
                        "usageCount": 1
                    }
                }
            }
        ]
    }
    
    try:
        response = httpx.post(
            url,
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-type": "application/json"
            }
        )
        response.raise_for_status()
        print(f"Successfully restored campaign {campaign_id} in Sanity.")
    except Exception as e:
        print(f"Failed to restore campaign {campaign_id} in Sanity: {e}")


def _financial_year_label(d: date) -> str:
    start_year = d.year if d.month >= 4 else d.year - 1
    return f"{start_year}-{str(start_year + 1)[-2:]}"


def create_sales_order(
    session: Session,
    *,
    customer_name: str,
    lines: list[dict],
    created_by: str,
    customer_phone: str | None = None,
    customer_address: str | None = None,
    customer_state: str | None = None,
    category: str | None = None,
    campaign_id: str | None = None,
    payment_mode: str | None = None,
    razorpay_order_id: str | None = None,
    raw_items: str | None = None,
    total_amount: Optional[Decimal] = None,
    discount_amount: Optional[Decimal] = None,
    discount_code: Optional[str] = None,
    customer_city: Optional[str] = None,
    customer_pincode: Optional[str] = None,
    customer_email: Optional[str] = None,
) -> SalesOrder:
    order = SalesOrder(
        customer_name=customer_name,
        customer_phone=customer_phone,
        customer_address=customer_address,
        customer_state=customer_state,
        customer_city=customer_city,
        customer_pincode=customer_pincode,
        customer_email=customer_email,
        category=category,
        campaign_id=campaign_id,
        payment_mode=payment_mode,
        razorpay_order_id=razorpay_order_id,
        raw_items=raw_items,
        total_amount=total_amount,
        discount_amount=discount_amount,
        discount_code=discount_code,
        status=SalesOrderStatus.DRAFT.value,
    )
    session.add(order)
    session.flush()
    for line in lines:
        session.add(SalesOrderLine(sales_order_id=order.id, **line))
    session.commit()
    return order


def fulfill_order(
    session: Session, *, order: SalesOrder, warehouse_id: int, created_by: str
) -> SalesOrder:
    """Checks every line has sufficient FG balance BEFORE writing anything,
    then writes all lines' ledger entries in one transaction — either the
    whole order ships or none of it does, never a half-fulfilled order."""
    if order.status != SalesOrderStatus.DRAFT.value:
        raise ValueError(f"Cannot fulfill order in status {order.status}")

    lines = session.query(SalesOrderLine).filter_by(sales_order_id=order.id).all()

    from app.style_variant.models import StyleVariant

    for line in lines:
        balance = fg_balance(session, line.variant_id, warehouse_id)
        if line.qty > balance:
            variant = session.get(StyleVariant, line.variant_id)
            if variant and variant.qty >= line.qty:
                adjustment_qty = variant.qty - balance
                if adjustment_qty > 0:
                    record_movement(
                        session,
                        variant_id=line.variant_id,
                        qty=adjustment_qty,
                        direction=Direction.IN,
                        txn_type="adjustment",
                        warehouse_id=warehouse_id,
                        reason_code="auto_sync",
                        created_by=created_by,
                        commit=False,
                    )
                    balance = variant.qty
            if line.qty > balance:
                if not variant:
                    raise InsufficientStockError(f"Variant ID {line.variant_id} no longer exists. Please edit the invoice and select a valid variant.")
                variant_name = f"{variant.color} {variant.size}"
                raise InsufficientStockError(
                    f"Variant ID {line.variant_id} ({variant_name}): requested {line.qty}, available {balance}"
                )
            
        # Keep StyleVariant.qty in sync
        variant = session.get(StyleVariant, line.variant_id)
        if variant:
            variant.qty -= int(line.qty)

    for line in lines:
        record_movement(
            session,
            variant_id=line.variant_id,
            qty=line.qty,
            direction=Direction.OUT,
            txn_type="sale",
            warehouse_id=warehouse_id,
            reason_code=None,
            reference_type="sales_order",
            reference_id=order.id,
            created_by=created_by,
            commit=False,
        )

    order.status = SalesOrderStatus.FULFILLED.value
    if not order.invoice_number:
        today = date.today()
        order.invoice_number = f"SC/{_financial_year_label(today)}/{order.id:04d}"
    session.commit()
    return order


def cancel_order(session: Session, *, order: SalesOrder) -> SalesOrder:
    if order.status != SalesOrderStatus.DRAFT.value:
        raise ValueError(f"Cannot cancel order in status {order.status}")
    order.status = SalesOrderStatus.CANCELLED.value
    
    if order.campaign_id:
        restore_sanity_campaign(order.campaign_id)
        
    session.commit()
    return order


def return_order(
    session: Session, 
    *, 
    order: SalesOrder, 
    created_by: str,
    refund_amount: Decimal | None = None,
    refund_account_details: str | None = None,
    notes: str | None = None,
) -> SalesOrder:
    if order.status != SalesOrderStatus.FULFILLED.value:
        raise ValueError(f"Cannot return order in status {order.status}")
    
    order.status = SalesOrderStatus.RETURNED.value
    
    from app.orders.models import SalesOrderResolution
    resolution = SalesOrderResolution(
        sales_order_id=order.id,
        resolution_type="return",
        refund_amount=refund_amount,
        refund_account_details=refund_account_details,
        notes=notes,
    )
    session.add(resolution)
    
    # Restock inventory
    lines = session.query(SalesOrderLine).filter_by(sales_order_id=order.id).all()
    from app.style_variant.models import StyleVariant
    for line in lines:
        record_movement(
            session,
            variant_id=line.variant_id,
            qty=line.qty,
            direction=Direction.IN,
            txn_type="return",
            warehouse_id=1,  # Default warehouse for now
            reason_code=None,
            reference_type="sales_order",
            reference_id=order.id,
            created_by=created_by,
            commit=False,
        )
        variant = session.get(StyleVariant, line.variant_id)
        if variant:
            variant.qty += int(line.qty)
            
    session.commit()
    return order


def replace_order(
    session: Session, 
    *, 
    order: SalesOrder, 
    created_by: str,
    notes: str | None = None,
) -> SalesOrder:
    if order.status != SalesOrderStatus.FULFILLED.value:
        raise ValueError(f"Cannot replace order in status {order.status}")
    
    order.status = SalesOrderStatus.REPLACED.value
    
    from app.orders.models import SalesOrderResolution
    resolution = SalesOrderResolution(
        sales_order_id=order.id,
        resolution_type="replace",
        notes=notes,
    )
    session.add(resolution)
    
    # Restock inventory just like return
    lines = session.query(SalesOrderLine).filter_by(sales_order_id=order.id).all()
    from app.style_variant.models import StyleVariant
    for line in lines:
        record_movement(
            session,
            variant_id=line.variant_id,
            qty=line.qty,
            direction=Direction.IN,
            txn_type="replacement",
            warehouse_id=1,  # Default warehouse for now
            reason_code=None,
            reference_type="sales_order",
            reference_id=order.id,
            created_by=created_by,
            commit=False,
        )
        variant = session.get(StyleVariant, line.variant_id)
        if variant:
            variant.qty += int(line.qty)
            
    session.commit()
    return order
