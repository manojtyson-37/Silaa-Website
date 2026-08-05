import re
from pydantic import BaseModel, field_validator
from typing import List, Optional, Any
from datetime import datetime

class AbandonedCartBase(BaseModel):
    items: Any # JSON array of items
    status: Optional[str] = "abandoned"

class AbandonedCartCreate(AbandonedCartBase):
    pass

class AbandonedCartOut(AbandonedCartBase):
    id: int
    customer_id: int
    drop_off_time: datetime
    
    model_config = {"from_attributes": True}


class CustomerBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None

    @field_validator('email', 'phone', 'address', 'gstin', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        if v == "":
            return None
        return v

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is None:
            return v
        # Strip common formatting
        cleaned = re.sub(r'[\s\-\(\)]', '', str(v))
        # Handle country code or leading zero
        if cleaned.startswith('+91'):
            cleaned = cleaned[3:]
        elif cleaned.startswith('0') and len(cleaned) == 11:
            cleaned = cleaned[1:]
            
        if not re.match(r'^[6789]\d{9}$', cleaned):
            raise ValueError("Phone number must be exactly 10 digits and start with 6, 7, 8, or 9.")
        return cleaned

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if v is None:
            return v
        if not re.match(r'^[\w\.\+\-]+@[\w\-]+\.[\w\.\-]+$', v):
            raise ValueError("Must be a valid email address.")
        return v

class CustomerCreate(CustomerBase):
    pass

class CustomerOut(CustomerBase):
    id: int
    created_at: datetime
    abandoned_carts: List[AbandonedCartOut] = []
    
    model_config = {"from_attributes": True}

class BulkUploadResultRow(BaseModel):
    row_index: int
    name: str
    status: str
    error_reason: Optional[str] = None

class BulkUploadResult(BaseModel):
    success_count: int
    error_count: int
    details: List[BulkUploadResultRow]

class TrackCartPayload(BaseModel):
    customer: dict
    items: Any
