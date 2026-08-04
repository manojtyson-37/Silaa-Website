import os
import sys
import datetime

# Setup paths to import from erp-backend
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'erp-backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from decimal import Decimal
from app.orders.models import SalesOrder, SalesOrderLine

# Use local db for cleanup
DB_URL = os.environ.get("DATABASE_URL", "sqlite:///erp-backend/erp.db")
print(f"Connecting to: {DB_URL.split('@')[-1] if '@' in DB_URL else DB_URL}")
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)
db = Session()

# Delete unknown orders
bad_orders = db.query(SalesOrder).filter(
    SalesOrder.customer_name == 'Unknown Customer'
).all()

for order in bad_orders:
    print(f"Deleting bad order: {order.id}")
    db.query(SalesOrderLine).filter_by(sales_order_id=order.id).delete()
    db.delete(order)

# Update Devini's order
devini_order = db.query(SalesOrder).filter(
    SalesOrder.customer_name == 'Devini'
).first()

if devini_order:
    print(f"Updating Devini's order: {devini_order.id}")
    # Fix the created_at timestamp
    # Razorpay Date: 2026-08-03 16:22:32
    devini_order.created_at = datetime.datetime(2026, 8, 3, 16, 22, 32)
    devini_order.razorpay_order_id = "order_TLGq1BJf1yLsb5"
    devini_order.raw_items = "Ivory Ease Cord Set (S) x1"
    devini_order.total_amount = Decimal("8500.00")

db.commit()
print("Cleanup complete.")
