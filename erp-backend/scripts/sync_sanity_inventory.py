import os
import sys
import httpx
from decimal import Decimal

# Add the parent directory to the Python path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import SessionLocal
from app.style_variant.models import StyleVariant
from app.finished_goods.service import fg_balance

def get_sanity_client():
    project_id = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID")
    dataset = os.environ.get("NEXT_PUBLIC_SANITY_DATASET", "production")
    token = os.environ.get("SANITY_API_WRITE_TOKEN")
    
    if not project_id or not token:
        print("Missing Sanity credentials in environment.")
        return None
        
    return httpx.Client(
        base_url=f"https://{project_id}.api.sanity.io/v2023-01-01/data",
        headers={"Authorization": f"Bearer {token}", "Content-type": "application/json"}
    )

def main():
    client = get_sanity_client()
    if not client:
        return
        
    db = SessionLocal()
    
    try:
        # Get all products from Sanity
        dataset = os.environ.get("NEXT_PUBLIC_SANITY_DATASET", "production")
        query_url = f"/query/{dataset}?query=*[_type == 'product']"
        resp = client.get(query_url)
        resp.raise_for_status()
        products = resp.json().get("result", [])
        
        mutations = []
        
        for product in products:
            variants = product.get("variants", [])
            changed = False
            new_variants = []
            
            for v in variants:
                erp_id = v.get("erpVariantId")
                new_v = v.copy()
                if erp_id:
                    # Fetch real balance from DB
                    try:
                        balance = fg_balance(db, int(erp_id), 1)
                        balance_int = int(balance)
                        if new_v.get("inventory") != balance_int:
                            new_v["inventory"] = balance_int
                            new_v["available"] = (balance_int > 0)
                            changed = True
                    except Exception as e:
                        print(f"Error checking balance for variant {erp_id}: {e}")
                
                new_variants.append(new_v)
                
            if changed:
                mutations.append({
                    "patch": {
                        "id": product["_id"],
                        "set": {
                            "variants": new_variants
                        }
                    }
                })
                
        if not mutations:
            print("No inventory updates needed.")
            return
            
        print(f"Applying {len(mutations)} inventory updates to Sanity...")
        
        mutate_url = f"/mutate/{dataset}"
        res = client.post(mutate_url, json={"mutations": mutations})
        res.raise_for_status()
        print("Successfully synced inventory to Sanity.")
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
