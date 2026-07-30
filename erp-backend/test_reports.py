from app.db import SessionLocal
from app.reports.router import get_wastage_report, get_fabric_variance_report

db = SessionLocal()
try:
    print("Wastage report:", get_wastage_report(db))
    print("Fabric variance report:", get_fabric_variance_report(db))
except Exception as e:
    print("Error:", e)
