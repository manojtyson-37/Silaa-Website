import os
import json
import urllib.request
import base64

ERP_URL = "https://silaa-website.vercel.app"
ADMIN_USER = "admin"
ADMIN_PASS = "EVzzTRm3gnwbAqFF"

# 1. Login to ERP
req = urllib.request.Request(
    f"{ERP_URL}/api/erp/auth/login",
    data=json.dumps({"username": ADMIN_USER, "password": ADMIN_PASS}).encode(),
    headers={"Content-Type": "application/json"}
)
res = urllib.request.urlopen(req)
token = json.loads(res.read())["access_token"]

# 2. Fetch Razorpay Orders
key_id = "rzp_live_TEVbYPguEtG38g"
key_secret = "Jnv0PGDusG44IhGFDj9htWrA"
auth_b64 = base64.b64encode(f"{key_id}:{key_secret}".encode()).decode()

req_rzp = urllib.request.Request(
    "https://api.razorpay.com/v1/orders?count=20",
    headers={"Authorization": f"Basic {auth_b64}"}
)
res_rzp = urllib.request.urlopen(req_rzp)
rzp_data = json.loads(res_rzp.read())

paid_orders = [o for o in rzp_data.get("items", []) if o.get("status") == "paid"]
print(f"Found {len(paid_orders)} paid orders in the last 20 Razorpay orders.")

for rzp_order in paid_orders:
    notes = rzp_order.get("notes", {})
    customer_raw = notes.get("customer", "")
    if "/" in customer_raw:
        customer_name, customer_phone = [x.strip() for x in customer_raw.split("/", 1)]
    else:
        customer_name = customer_raw
        customer_phone = ""
        
    address = notes.get("address", "")
    items_str = notes.get("items", "Unknown Items")
    
    final_address = f"{address}\n\n[WARNING: Order contains items missing from ERP catalogue: {items_str}]"
    
    payload = {
        "customer_name": customer_name or "Unknown Customer",
        "customer_phone": customer_phone,
        "customer_address": final_address,
        "customer_state": "Website Order",
        "category": "B2C",
        "campaign_id": None,
        "lines": [],
        "created_by": "Historical Recovery Script"
    }

    req_create = urllib.request.Request(
        f"{ERP_URL}/api/erp/sales-orders",
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
    )
    
    try:
        res_create = urllib.request.urlopen(req_create)
        print(f"Created ERP order for Razorpay Order {rzp_order['id']} ({customer_name})")
    except Exception as e:
        print(f"Failed to create order for {rzp_order['id']}: {e}")
        if hasattr(e, 'read'):
            print(e.read().decode())
