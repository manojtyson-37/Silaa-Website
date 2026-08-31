import os
import sys
import httpx
from decimal import Decimal

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import SessionLocal
from app.style_variant.models import Style, StyleVariant
from app.finished_goods.service import record_movement
from app.core.ledger_base import Direction

def get_sanity_client():
    project_id = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID")
    dataset = os.environ.get("NEXT_PUBLIC_SANITY_DATASET", "production")
    token = os.environ.get("SANITY_API_WRITE_TOKEN")
    
    if not project_id or not token:
        print("Missing Sanity credentials in environment.")
        return None
        
    return httpx.Client(
        base_url=f"https://{project_id}.api.sanity.io/v2023-01-01/data",
        headers={"Authorization": f"Bearer {token}", "Content-type": "application/json"},
        timeout=30.0
    )

def generate_sku(title, color, size):
    # Basic SKU generation: e.g. "MEADOW-GRN-S"
    safe_title = title.replace(" ", "").upper()[:6]
    safe_color = (color or "NOC").replace(" ", "").upper()[:3]
    safe_size = (size or "NOS").replace(" ", "").upper()[:3]
    return f"{safe_title}-{safe_color}-{safe_size}"

def main():
    client = get_sanity_client()
    if not client:
        return
        
    db = SessionLocal()
    
    try:
        # get default warehouse ID
        warehouse_id = 1
        
        # Get all products from Sanity
        dataset = os.environ.get("NEXT_PUBLIC_SANITY_DATASET", "production")
        query_url = f"/query/{dataset}?query=*[_type == 'product']{{ _id, title, category, 'image': images[0].asset->url, variants[]{{ ..., 'size_name': size->name, 'color_name': color->name }} }}"
        
        print("Fetching products from Sanity...")
        resp = client.get(query_url)
        resp.raise_for_status()
        products = resp.json().get("result", [])
        print(f"Found {len(products)} products in Sanity.")
        
        mutations = []
        total_inventory_recovered = 0
        
        for product in products:
            title = product.get("title")
            if not title:
                continue
                
            # Create or find Style
            style = db.query(Style).filter(Style.name == title).first()
            if not style:
                style = Style(
                    name=title,
                    category=product.get("category", "unassigned"),
                    collection="Restored Catalog",
                    image_url=product.get("image")
                )
                db.add(style)
                db.flush()
            
            variants = product.get("variants", [])
            if not variants:
                continue
                
            new_variants = []
            changed = False
            
            for v in variants:
                size = v.get("size_name") or "Default Size"
                color = v.get("color_name") or "Default Color"
                price = v.get("price") or 0
                inventory = v.get("inventory") or 0
                
                # Check if variant exists
                variant = db.query(StyleVariant).filter(
                    StyleVariant.style_id == style.id,
                    StyleVariant.size == size,
                    StyleVariant.color == color
                ).first()
                
                if not variant:
                    sku = generate_sku(title, color, size)
                    # Handle SKU collisions in case generated SKU already exists
                    original_sku = sku
                    collision_count = db.query(StyleVariant).filter(StyleVariant.sku_code.startswith(sku)).count()
                    if collision_count > 0:
                        sku = f"{sku}-{collision_count+1}"
                        
                    variant = StyleVariant(
                        style_id=style.id,
                        color=color,
                        size=size,
                        sku_code=sku,
                        selling_price=Decimal(str(price)),
                        qty=0  # qty is updated via ledger
                    )
                    db.add(variant)
                    db.flush()
                
                # Restore inventory via ledger if inventory > 0
                if inventory > 0:
                    # check current balance first just in case script is run twice
                    from app.finished_goods.service import fg_balance
                    current_bal = fg_balance(db, variant.id, warehouse_id)
                    if current_bal < inventory:
                        diff = inventory - int(current_bal)
                        record_movement(
                            session=db,
                            variant_id=variant.id,
                            warehouse_id=warehouse_id,
                            qty=Decimal(str(diff)),
                            direction=Direction.IN,
                            txn_type="adjustment",
                            reason_code="migration_recovery",
                            created_by="recover_catalog_script",
                            commit=False
                        )
                        total_inventory_recovered += diff
                
                # Map back to sanity
                new_v = v.copy()
                if new_v.get("erpVariantId") != variant.id:
                    new_v["erpVariantId"] = variant.id
                    changed = True
                    
                # Clean up temporary query fields before pushing back
                if "size_name" in new_v: del new_v["size_name"]
                if "color_name" in new_v: del new_v["color_name"]
                
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
        
        db.commit()
        print(f"Committed new Styles, Variants, and {total_inventory_recovered} inventory items to ERP.")
        
        if not mutations:
            print("No Sanity updates needed.")
            return
            
        print(f"Applying {len(mutations)} erpVariantId mapping updates to Sanity...")
        
        mutate_url = f"/mutate/{dataset}"
        res = client.post(mutate_url, json={"mutations": mutations})
        res.raise_for_status()
        print("Successfully linked Sanity variants to new ERP database.")
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
