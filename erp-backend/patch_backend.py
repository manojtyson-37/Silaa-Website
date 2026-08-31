import os
import re

with open("app/orders/service.py", "r") as f:
    service_content = f.read()

shiprocket_func = """
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
        match = re.search(r'\\b\\d{6}\\b', order.customer_address)
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
"""

with open("app/orders/service.py", "a") as f:
    f.write("\n" + shiprocket_func + "\n")
