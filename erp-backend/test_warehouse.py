import os
from app.db import SessionLocal
from app.core.warehouse import get_default_warehouse
from app import wiring

wiring.configure()

db = SessionLocal()
try:
    wh = get_default_warehouse(db)
    if wh is None:
        print("Warehouse is None!")
    else:
        print("Warehouse ID:", wh.id)
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
