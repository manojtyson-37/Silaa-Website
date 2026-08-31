import os
from app.db import SessionLocal
from app.orders.models import SalesOrder
from app.shiprocket.client import get_token

db = SessionLocal()
try:
    print(get_token())
except Exception as e:
    print("Error:", e)
finally:
    db.close()
