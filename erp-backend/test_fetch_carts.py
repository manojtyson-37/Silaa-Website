from app.db import SessionLocal
from app.customers.models import AbandonedCart

db = SessionLocal()
carts = db.query(AbandonedCart).all()
for cart in carts:
    print(cart.items)
