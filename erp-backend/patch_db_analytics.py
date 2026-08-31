import re

with open("app/db.py", "r") as f:
    content = f.read()

if "from app.dashboard.models import PageVisit" not in content:
    content = content.replace("from app.notifications.models import Notification", 
        "from app.notifications.models import Notification\nfrom app.dashboard.models import PageVisit")

with open("app/db.py", "w") as f:
    f.write(content)
