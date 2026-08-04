import os
from app.shiprocket.client import get_token

def test():
    try:
        token = get_token()
        print(f"SUCCESS! Got token starting with: {token[:10]}...")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test()
