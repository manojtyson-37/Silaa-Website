import re

with open("app/dashboard/router.py", "r") as f:
    content = f.read()

content = re.sub(r'class TrackVisitIn\(BaseModel\):.*?return \{"status": "success"\}', '', content, flags=re.DOTALL)

with open("app/dashboard/router.py", "w") as f:
    f.write(content)
