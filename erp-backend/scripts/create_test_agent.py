import os
import sys

# Ensure backend root is in PYTHONPATH
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.auth.models import User
from app.auth.security import hash_password

def create_test_agent():
    db: Session = SessionLocal()
    try:
        # Check if test_agent already exists
        existing_user = db.query(User).filter(User.username == "test_agent").first()
        if existing_user:
            print("test_agent user already exists.")
            return

        print("Creating test_agent user...")
        # create test_agent with password "test_agent123"
        hashed = hash_password("test_agent123")
        test_user = User(
            username="test_agent",
            password_hash=hashed,
            role="viewer",
            is_active=True
        )
        db.add(test_user)
        db.commit()
        print("Successfully created test_agent user with viewer role!")

    except Exception as e:
        db.rollback()
        print(f"Error creating test_agent: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_agent()
