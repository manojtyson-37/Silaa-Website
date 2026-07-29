from pydantic import BaseModel
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

class CustomerCreate(CustomerBase):
    pass

class CustomerOut(CustomerBase):
    id: int
    created_at: datetime
    abandoned_carts: List[AbandonedCartOut] = []
    
    model_config = {"from_attributes": True}
