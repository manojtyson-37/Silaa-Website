import os
import sys
import json
import urllib.request
import urllib.parse

ERP_URL = "https://silaa-website.vercel.app"
ADMIN_USER = "admin"
ADMIN_PASS = "EVzzTRm3gnwbAqFF"

# 1. Login
req = urllib.request.Request(
    f"{ERP_URL}/api/erp/auth/login",
    data=json.dumps({"username": ADMIN_USER, "password": ADMIN_PASS}).encode(),
    headers={"Content-Type": "application/json"}
)
res = urllib.request.urlopen(req)
token = json.loads(res.read())["access_token"]

# 2. Find Variant ID
req2 = urllib.request.Request(
    f"{ERP_URL}/api/erp/styles-with-variants",
    headers={"Authorization": f"Bearer {token}"}
)
res2 = urllib.request.urlopen(req2)
data = json.loads(res2.read())
variants = []
for style in data:
    for v in style.get("variants", []):
        v["style_name"] = style.get("name", "")
        variants.append(v)

target_variant_id = None
for v in variants:
    # Look for Ivory Ease Cord Set, Size S
    if "Ivory" in v.get("name", "") or "Ivory" in v.get("style_name", "") or "Cord" in v.get("style_name", ""):
        if v.get("size") == "S":
            target_variant_id = v["id"]
            print(f"Found variant: {v}")
            break

if not target_variant_id:
    print("Could not find exact variant for Ivory Ease Cord Set (S). Using first match or failing.")
    for v in variants:
        if "Ivory" in v.get("name", "") or "Ivory" in v.get("style_name", ""):
            target_variant_id = v["id"]
            print(f"Fallback variant: {v}")
            break

if not target_variant_id:
    print("Variant not found in ERP. Cannot sync order automatically. Available variants:")
    for v in variants:
        print(f"- ID: {v['id']}, Style: {v.get('style_name')}, Name: {v.get('name')}, Size: {v.get('size')}")
    sys.exit(1)

# 3. Create Order
order_payload = {
    "customer_name": "Devini",
    "customer_phone": "8904468633",
    "customer_address": "Perambur chennai, Chennai 600085",
    "customer_state": "Website Order",
    "category": "B2C",
    "campaign_id": None,
    "lines": [
        {
            "variant_id": target_variant_id,
            "qty": 1,
            "unit_price": 1499.00,
            "gst_percent": 5
        }
    ],
    "created_by": "Website Integration"
}

req3 = urllib.request.Request(
    f"{ERP_URL}/api/erp/sales-orders",
    data=json.dumps(order_payload).encode(),
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
)

try:
    res3 = urllib.request.urlopen(req3)
    print("Successfully created order!")
    print(res3.read().decode())
except Exception as e:
    print(f"Failed to create order: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode())
