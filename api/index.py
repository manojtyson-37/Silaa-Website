import sys
import os

# Add the erp-backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "erp-backend"))

from app.main import app
