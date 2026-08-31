with open("app/main.py", "r") as f:
    content = f.read()

if "from app.dashboard.public_router import router as public_analytics_router" not in content:
    content = content.replace("from app.dashboard.router import router as dashboard_router",
        "from app.dashboard.router import router as dashboard_router\nfrom app.dashboard.public_router import router as public_analytics_router")
    content = content.replace("app.include_router(dashboard_router, dependencies=_protected)",
        "app.include_router(dashboard_router, dependencies=_protected)\napp.include_router(public_analytics_router)")
with open("app/main.py", "w") as f:
    f.write(content)
