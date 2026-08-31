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

    try:
        from app.notifications.models import Notification
        msg = f"New order placed by {customer_name}"
        if total_amount:
            msg += f" for ₹{total_amount}"
        # We only want to notify for Website orders ideally, or all placed orders? The user said "everytime there is an order placed"
        notif = Notification(
            title="New Order Received",
            message=msg,
            link_url=f"/sales-orders?highlight={order.id}"
        )
        session.add(notif)
        session.commit()
    except Exception as e:
        print(f"Failed to create notification: {str(e)}")
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

    # Auto-push to Shiprocket if configured
    try:
        from app.expenses.models import CompanySetting
        auto_push = session.get(CompanySetting, "shiprocket_auto_push")
        if auto_push and auto_push.value.lower() == "true":
            if not order.shiprocket_order_id:
                try:
                    sync_to_shiprocket(session, order)
                except Exception as e:
                    print(f"Auto-push to Shiprocket failed: {str(e)}")
    except:
        pass
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

    session.commit()
    return order


from app.shiprocket.client import (
    create_order as shiprocket_create_order,
    assign_awb as shiprocket_assign_awb,
    schedule_pickup as shiprocket_schedule_pickup
)
from app.expenses.models import CompanySetting
import re

def sync_to_shiprocket(session: Session, order: SalesOrder):
    if order.shiprocket_order_id:
        raise ValueError("Order already pushed to Shiprocket")
        
    lines = session.query(SalesOrderLine).filter_by(sales_order_id=order.id).all()
    if not lines:
        raise ValueError("Order has no lines")
        
    city = order.customer_city
    pincode = order.customer_pincode
    
    if not pincode and order.customer_address:
        match = re.search(r'\b\d{6}\b', order.customer_address)
        if match:
            pincode = match.group(0)
            
    if not city:
        city = order.customer_state or "Bengaluru"
        
    if not pincode:
        raise ValueError("Cannot push to Shiprocket without a Pincode. Please edit the order to add one.")
        
    if not order.customer_address or len(order.customer_address.strip()) < 10:
        raise ValueError("Cannot push to Shiprocket: Address must be at least 10 characters long.")
        
    name_parts = (order.customer_name or "").strip().split(" ", 1)
    first_name = name_parts[0] or "Customer"
    last_name = name_parts[1] if len(name_parts) > 1 else " "
        
    from app.style_variant.models import StyleVariant
    
    items = []
    sub_total = 0
    for l in lines:
        v = session.get(StyleVariant, l.variant_id)
        if not v:
            continue
        items.append({
            "name": f"{v.sku_code} - {v.color} - {v.size}",
            "sku": v.sku_code,
            "units": int(l.qty),
            "selling_price": float(l.unit_price),
            "discount": 0,
            "tax": float(l.gst_percent)
        })
        sub_total += float(l.qty * l.unit_price)

    pickup_loc = session.get(CompanySetting, "shiprocket_pickup_location")
    pickup_location = pickup_loc.value if pickup_loc else "Divya"
    
    length_setting = session.get(CompanySetting, "shiprocket_length")
    length = float(length_setting.value) if length_setting else 10.0
    
    breadth_setting = session.get(CompanySetting, "shiprocket_breadth")
    breadth = float(breadth_setting.value) if breadth_setting else 10.0
    
    height_setting = session.get(CompanySetting, "shiprocket_height")
    height = float(height_setting.value) if height_setting else 10.0
    
    weight_setting = session.get(CompanySetting, "shiprocket_weight")
    weight = float(weight_setting.value) if weight_setting else 0.5

    payload = {
        "order_id": f"Silaa-{order.id}",
        "order_date": order.created_at.strftime("%Y-%m-%d %H:%M"),
        "pickup_location": pickup_location,
        "billing_customer_name": first_name,
        "billing_last_name": last_name,
        "billing_address": order.customer_address.strip(),
        "billing_city": city,
        "billing_pincode": pincode,
        "billing_state": order.customer_state or "Karnataka",
        "billing_country": "India",
        "billing_email": order.customer_email or "info@silacollective.in",
        "billing_phone": order.customer_phone or "9999999999",
        "shipping_is_billing": True,
        "order_items": items,
        "payment_method": "Prepaid" if order.payment_mode != "Cash" else "COD",
        "sub_total": sub_total,
        "length": length,
        "breadth": breadth,
        "height": height,
        "weight": weight
    }
    
    res = shiprocket_create_order(payload)
    order_id_sr = res.get("order_id")
    shipment_id = res.get("shipment_id")
    awb_code = res.get("awb_code")
    
    if not awb_code and shipment_id:
        try:
            awb_res = shiprocket_assign_awb(shipment_id)
            if awb_res.get("awb_assign_status") == 1:
                awb_code = awb_res.get("response", {}).get("data", {}).get("awb_code")
        except:
            pass
            
    order.shiprocket_order_id = order_id_sr
    order.shiprocket_shipment_id = shipment_id
    order.shiprocket_awb = awb_code
    
    if shipment_id:
        try:
            shiprocket_schedule_pickup(shipment_id)
        except Exception as e:
            print(f"Failed to schedule pickup: {str(e)}")

