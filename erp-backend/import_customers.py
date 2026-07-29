import csv
from sqlalchemy.orm import Session
from app.db import SessionLocal, engine, Base
from app.customers.models import Customer
import sys
import os

def import_customers(csv_path: str):
    db = SessionLocal()
    try:
        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                first = row.get("First Name", "").strip()
                last = row.get("Last Name", "").strip()
                name = f"{first} {last}".strip()
                email = row.get("Email", "").strip() or None
                phone = row.get("Phone", "").strip() or row.get("Default Address Phone", "").strip() or None
                
                # construct address
                addr1 = row.get("Default Address Address1", "").strip()
                city = row.get("Default Address City", "").strip()
                state = row.get("Default Address Province Code", "").strip()
                zipc = row.get("Default Address Zip", "").strip()
                
                address_parts = [p for p in [addr1, city, state, zipc] if p]
                address = ", ".join(address_parts) if address_parts else None

                # clean up phone number
                if phone and phone.startswith("'"):
                    phone = phone[1:]
                
                if not name and not email and not phone:
                    continue
                    
                # check if email or phone exists (we shouldn't crash if it does)
                existing = None
                if email:
                    existing = db.query(Customer).filter(Customer.email == email).first()
                
                if not existing:
                    customer = Customer(
                        name=name or "Unknown",
                        email=email,
                        phone=phone,
                        address=address
                    )
                    db.add(customer)
                    count += 1
            
            db.commit()
            print(f"Imported {count} customers.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    csv_file = sys.argv[1]
    import_customers(csv_file)
