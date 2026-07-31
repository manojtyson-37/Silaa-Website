import sys
import os

# Ensure the root of the project is in the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import delete
from sqlalchemy.orm import Session
from app.db import Base, engine
from app.style_variant.models import *
from app.procurement.models import *
from app.fabric_inventory.models import *
from app.production.models import *
from app.orders.models import *
from app.expenses.models import *
from app.customers.models import *
from app.auth.models import *
from app.uom.models import *
from app.finished_goods.models import *
from app.accessory_inventory.models import *
from app.bom.models import *

# Explicit list of tables to keep
PRESERVE_TABLES = {
    'users',
    'expense_category',
    'expense_category_budget',
    'expense',
    'company_setting',
    'unit_of_measure',
    'uom_conversion',
    'alembic_version'
}

def wipe_data():
    print("Starting ERP Data Wipe...")
    print(f"Connected to database: {engine.url}")
    
    # Base.metadata.sorted_tables returns tables in dependency order (parents before children).
    # We need to reverse it so we delete from children (foreign keys) before parents.
    tables = list(reversed(Base.metadata.sorted_tables))
    
    deleted_count = 0
    with Session(engine) as session:
        for table in tables:
            if table.name in PRESERVE_TABLES:
                print(f"Skipping table (preserved): {table.name}")
                continue
            
            print(f"Deleting data from table: {table.name}")
            try:
                # Issue delete statement without WHERE clause to delete all rows
                result = session.execute(delete(table))
                print(f" -> Deleted {result.rowcount} rows from {table.name}")
                deleted_count += 1
            except Exception as e:
                print(f" -> ERROR deleting from {table.name}: {e}")
                session.rollback()
                raise e
        
        # Commit the transaction once all deletes succeed
        session.commit()
        print(f"\nSuccessfully wiped data from {deleted_count} tables.")
        print("Expense and authentication data have been preserved.")

if __name__ == '__main__':
    # Add a simple safety prompt to prevent accidental execution if run interactively
    confirm = input(f"WARNING: This will permanently delete ERP data from {engine.url}. Type 'WIPE' to confirm: ")
    if confirm == "WIPE":
        wipe_data()
    else:
        print("Operation cancelled.")
