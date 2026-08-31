import sys
import os

from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.style_variant.models import StyleVariant
from app.finished_goods.models import FinishedGoodsLedgerEntry
from app.core.ledger_base import compute_balance

def main():
    db = SessionLocal()
    variants = db.query(StyleVariant).all()
    out_of_sync = 0
    
    print("Scanning variants for stock display desync...")
    for v in variants:
        balance = int(compute_balance(db, FinishedGoodsLedgerEntry, {"variant_id": v.id}, warehouse_id=1))
        if v.qty != balance:
            print(f"Variant {v.id} ({v.sku_code}): display qty = {v.qty}, correct ledger balance = {balance}")
            out_of_sync += 1
            v.qty = balance
            
    if out_of_sync > 0:
        print(f"Found {out_of_sync} out of sync variants. Committing fix to the database...")
        db.commit()
        print("Success! Display quantities are now fully synced with the ledger.")
    else:
        print("All variant display quantities are already perfectly in sync with the ledger.")
        
    db.close()

if __name__ == "__main__":
    main()
