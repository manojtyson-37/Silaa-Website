import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL.startswith("postgresql+psycopg2://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

from sqlalchemy import text
res = db.execute(text("SELECT * FROM customers WHERE email='test_abandoned@example.com'")).fetchall()
print("Customer:", res)

if res:
    carts = db.execute(text(f"SELECT * FROM abandoned_carts WHERE customer_id={res[0][0]}")).fetchall()
    print("Carts:", carts)
