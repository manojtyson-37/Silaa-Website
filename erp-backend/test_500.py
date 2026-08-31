import os
import sys

from app.db import SessionLocal
from app.orders.models import SalesOrder
from app.orders.service import fulfill_order
from app import wiring

wiring.configure()

db = SessionLocal()
try:
    order = db.get(SalesOrder, 27)
    if order:
        if order.status != "draft":
            order.status = "draft"
            db.commit()
            print("Set order 27 to draft")
        fulfill_order(db, order=order, warehouse_id=1, created_by="test")
        print("Success")
    else:
        print("Order 27 not found")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
