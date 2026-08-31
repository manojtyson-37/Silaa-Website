import re

with open("app/expenses/router.py", "r") as f:
    content = f.read()

# Add endpoint at the end of the file
new_endpoint = """
@router.get("/shiprocket-pickup-locations")
def list_pickup_locations(db: Session = Depends(get_db)):
    try:
        from app.shiprocket.client import get_pickup_locations
        locations = get_pickup_locations()
        return {"locations": locations}
    except Exception as e:
        raise HTTPException(500, f"Shiprocket error: {str(e)}")
"""

with open("app/expenses/router.py", "a") as f:
    f.write("\n" + new_endpoint + "\n")
