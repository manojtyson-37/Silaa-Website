import os
from app.db import SessionLocal
from app.orders.models import SalesOrder
from app.orders.router import SalesOrderOut
from app import wiring

wiring.configure()

db = SessionLocal()
try:
    order = db.get(SalesOrder, 27)
    if order:
        out = SalesOrderOut.model_validate(order)
        print("Pydantic success:", out.model_dump_json())
    else:
        print("Order not found")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
