import re

with open("app/orders/router.py", "r") as f:
    content = f.read()

# Replace push_to_shiprocket body
match = re.search(r'(@router\.post\("/sales-orders/\{order_id\}/shiprocket"\)\ndef push_to_shiprocket\(order_id: int, db: Session = Depends\(get_db\)\):).*?(?=\n\n@|\Z)', content, re.DOTALL)
if match:
    new_func = """@router.post("/sales-orders/{order_id}/shiprocket")
def push_to_shiprocket(order_id: int, db: Session = Depends(get_db)):
    order = db.get(SalesOrder, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
        
    from app.orders.service import sync_to_shiprocket
    try:
        sync_to_shiprocket(db, order)
        db.commit()
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Shiprocket Error: {str(e)}")
        
    return {"status": "success", "shiprocket_order_id": order.shiprocket_order_id, "shiprocket_awb": order.shiprocket_awb}
"""
    content = content[:match.start()] + new_func + content[match.end():]
    with open("app/orders/router.py", "w") as f:
        f.write(content)
