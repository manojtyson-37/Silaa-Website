import re

with open("app/orders/service.py", "r") as f:
    content = f.read()

# Add a notification insert inside create_sales_order
match = re.search(r'(def create_sales_order\(.*?\) -> SalesOrder:.*?)(    return order)', content, re.DOTALL)
if match:
    old_func = match.group(1)
    
    injection = """
    try:
        from app.notifications.models import Notification
        msg = f"New order placed by {customer_name}"
        if total_amount:
            msg += f" for ₹{total_amount}"
        # We only want to notify for Website orders ideally, or all placed orders? The user said "everytime there is an order placed"
        notif = Notification(
            title="New Order Received",
            message=msg,
            link_url=f"/sales-orders?highlight={order.id}"
        )
        session.add(notif)
        session.commit()
    except Exception as e:
        print(f"Failed to create notification: {str(e)}")
"""
    new_func = old_func + injection + "    return order"
    content = content[:match.start()] + new_func + content[match.end():]
    with open("app/orders/service.py", "w") as f:
        f.write(content)
