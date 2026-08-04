import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.customers.models import AbandonedCart

engine = create_engine(os.environ.get("DATABASE_URL"))
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

carts = db.query(AbandonedCart).all()
print(f"Total carts: {len(carts)}")
for cart in carts:
    print(cart.items)
