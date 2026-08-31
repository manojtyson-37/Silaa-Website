import re

with open("app/orders/service.py", "r") as f:
    content = f.read()

fulfill_match = re.search(r'(def fulfill_order\(.*?\) -> SalesOrder:.*?)(    return order)', content, re.DOTALL)
if fulfill_match:
    old_func = fulfill_match.group(1)
    
    # insert before "return order"
    injection = """
    # Auto-push to Shiprocket if configured
    try:
        from app.expenses.models import CompanySetting
        auto_push = session.get(CompanySetting, "shiprocket_auto_push")
        if auto_push and auto_push.value.lower() == "true":
            if not order.shiprocket_order_id:
                try:
                    sync_to_shiprocket(session, order)
                except Exception as e:
                    print(f"Auto-push to Shiprocket failed: {str(e)}")
    except:
        pass
"""
    new_func = old_func + injection + "    return order"
    content = content[:fulfill_match.start()] + new_func + content[fulfill_match.end():]
    with open("app/orders/service.py", "w") as f:
        f.write(content)
