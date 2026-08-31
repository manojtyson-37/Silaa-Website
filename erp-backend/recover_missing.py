import json
import urllib.request
import base64
import sys
from decimal import Decimal
import os

os.environ["DATABASE_URL"] = "postgresql+psycopg2://postgres.nxwiyupkznedqknwquhc:Mymoney%401997%40@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

from app.db import SessionLocal
from app.orders.service import create_sales_order
from app.orders.models import SalesOrder

key_id = 'rzp_live_TEVbYPguEtG38g'
key_secret = 'Jnv0PGDusG44IhGFDj9htWrA'
auth_b64 = base64.b64encode(f'{key_id}:{key_secret}'.encode()).decode()

req_rzp = urllib.request.Request(
    'https://api.razorpay.com/v1/orders/order_TRyvsOIKiuvcXO',
    headers={'Authorization': f'Basic {auth_b64}'}
)
try:
    res_rzp = urllib.request.urlopen(req_rzp)
    rzp_order = json.loads(res_rzp.read())
except Exception as e:
    print("Failed to fetch from razorpay", e)
    sys.exit(1)

notes = rzp_order.get("notes", {})
customer_raw = notes.get("customer", "")
if "/" in customer_raw:
    customer_name, customer_phone = [x.strip() for x in customer_raw.split("/", 1)]
else:
    customer_name = customer_raw
    customer_phone = ""
    
address = notes.get("address", "")
items_str = notes.get("items", "Unknown Items")
final_address = f"{address}\n\n[Recovery Script Note: Items: {items_str}]"

db = SessionLocal()
try:
    existing = db.query(SalesOrder).filter(SalesOrder.razorpay_order_id == rzp_order['id']).first()
    if existing:
        print("Order already exists in ERP:", existing.id)
    else:
        order = create_sales_order(
            db,
            customer_name=customer_name or "Navya Pai",
            customer_phone=customer_phone,
            customer_address=final_address,
            customer_state="Website Order",
            payment_mode="prepaid",
            category="B2C",
            razorpay_order_id=rzp_order['id'],
            lines=[], 
            created_by="Recovery Script",
            total_amount=Decimal(rzp_order['amount']) / 100,
            raw_items=items_str
        )
        print("Recovered Order ID:", order.id)
finally:
    db.close()
