import os
import time
import requests
from typing import Dict, Any, Optional

SHIPROCKET_API_URL = "https://apiv2.shiprocket.in"
SHIPROCKET_API_EMAIL = os.environ.get("SHIPROCKET_API_EMAIL")
SHIPROCKET_API_PASSWORD = os.environ.get("SHIPROCKET_API_PASSWORD")

_cached_token = None
_token_expiry = 0

def get_token() -> str:
    global _cached_token, _token_expiry
    
    if _cached_token and time.time() < _token_expiry:
        return _cached_token
        
    if not SHIPROCKET_API_EMAIL or not SHIPROCKET_API_PASSWORD:
        raise Exception("Shiprocket credentials are not configured in environment")
        
    res = requests.post(f"{SHIPROCKET_API_URL}/v1/external/auth/login", json={
        "email": SHIPROCKET_API_EMAIL,
        "password": SHIPROCKET_API_PASSWORD
    })
    
    if not res.ok:
        raise Exception(f"Shiprocket auth failed: {res.text}")
        
    data = res.json()
    _cached_token = data.get("token")
    # Tokens usually valid for 10 days, cache for 9 days to be safe
    _token_expiry = time.time() + (9 * 24 * 60 * 60)
    
    return _cached_token


def create_order(payload: Dict[str, Any]) -> Dict[str, Any]:
    token = get_token()
    res = requests.post(
        f"{SHIPROCKET_API_URL}/v1/external/orders/create/ad-hoc",
        headers={"Authorization": f"Bearer {token}"},
        json=payload
    )
    
    if not res.ok:
        raise Exception(f"Shiprocket order creation failed: {res.text}")
        
    return res.json()


def assign_awb(shipment_id: int) -> Dict[str, Any]:
    token = get_token()
    res = requests.post(
        f"{SHIPROCKET_API_URL}/v1/external/courier/assign/awb",
        headers={"Authorization": f"Bearer {token}"},
        json={"shipment_id": shipment_id}
    )
    
    if not res.ok:
        raise Exception(f"Shiprocket AWB assignment failed: {res.text}")
        
    return res.json()

def schedule_pickup(shipment_id: int) -> Dict[str, Any]:
    token = get_token()
    res = requests.post(
        f"{SHIPROCKET_API_URL}/v1/external/courier/generate/pickup",
        headers={"Authorization": f"Bearer {token}"},
        json={"shipment_id": [shipment_id]}
    )
    
    if not res.ok:
        raise Exception(f"Shiprocket pickup generation failed: {res.text}")
        
    return res.json()

def get_pickup_locations() -> list:
    token = get_token()
    res = requests.get(
        f"{SHIPROCKET_API_URL}/v1/external/settings/company/pickup",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if not res.ok:
        raise Exception(f"Shiprocket fetch pickup locations failed: {res.text}")
        
    data = res.json()
    locations = data.get("data", {}).get("shipping_address", [])
    return [loc.get("pickup_location") for loc in locations if loc.get("pickup_location")]
