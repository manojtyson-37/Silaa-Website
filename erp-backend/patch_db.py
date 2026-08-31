import re

with open("app/db.py", "r") as f:
    content = f.read()

# Make sure to import Notification so alembic picks it up
# Add right before Base.metadata.create_all
if "from app.notifications.models import Notification" not in content:
    content = content.replace("from app.finished_goods.models import FinishedGoodsLedgerEntry", 
        "from app.finished_goods.models import FinishedGoodsLedgerEntry\nfrom app.notifications.models import Notification")

with open("app/db.py", "w") as f:
    f.write(content)
