import re

with open("app/main.py", "r") as f:
    content = f.read()

if "from app.notifications.router import router as notifications_router" not in content:
    content = content.replace("from app.finished_goods.router import router as finished_goods_router", 
        "from app.finished_goods.router import router as finished_goods_router\nfrom app.notifications.router import router as notifications_router")
    
    content = content.replace("app.include_router(finished_goods_router)", 
        "app.include_router(finished_goods_router)\napp.include_router(notifications_router)")

with open("app/main.py", "w") as f:
    f.write(content)
