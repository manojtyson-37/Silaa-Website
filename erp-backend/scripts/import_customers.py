import csv
import sys
import os
import re

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.orm import Session
from app.db import engine
from app.customers.models import Customer

def clean_phone(phone_raw):
    if not phone_raw:
        return None
    cleaned = re.sub(r'[\s\-\(\)\']', '', str(phone_raw))
    if cleaned.startswith('+91'):
        cleaned = cleaned[3:]
    elif cleaned.startswith('0') and len(cleaned) == 11:
        cleaned = cleaned[1:]
    
    if not re.match(r'^[6789]\d{9}$', cleaned):
        return None
    return cleaned

def run_import():
    csv_path = os.path.join(os.path.dirname(__file__), '../../customers_export-2.csv')
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        customers_to_add = []
        
        for row in reader:
            name_parts = []
            if row.get('First Name'): name_parts.append(row['First Name'].strip())
            if row.get('Last Name'): name_parts.append(row['Last Name'].strip())
            name = " ".join(name_parts)
            if not name:
                name = "Unknown"
                
            email = row.get('Email', '').strip()
            if not email:
                email = None
                
            phone_raw = row.get('Default Address Phone') or row.get('Phone')
            phone = clean_phone(phone_raw)
            
            addr_parts = []
            if row.get('Default Address Address1'): addr_parts.append(row['Default Address Address1'].strip())
            if row.get('Default Address Address2'): addr_parts.append(row['Default Address Address2'].strip())
            if row.get('Default Address City'): addr_parts.append(row['Default Address City'].strip())
            if row.get('Default Address Province Code'): addr_parts.append(row['Default Address Province Code'].strip())
            if row.get('Default Address Zip'): addr_parts.append(row['Default Address Zip'].strip())
            address = ", ".join(addr_parts) if addr_parts else None
            
            customers_to_add.append(Customer(
                name=name,
                email=email,
                phone=phone,
                address=address
            ))
            
        with Session(engine) as session:
            # We skip duplicates based on email if necessary, but we just wiped the DB
            session.add_all(customers_to_add)
            session.commit()
            print(f"Imported {len(customers_to_add)} customers successfully.")

if __name__ == '__main__':
    run_import()
