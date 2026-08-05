from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    gstin = Column(String(15), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    abandoned_carts = relationship("AbandonedCart", back_populates="customer", cascade="all, delete")


class AbandonedCart(Base):
    __tablename__ = "abandoned_carts"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    items = Column(JSON, nullable=False) # Store what they added to cart
    drop_off_time = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="abandoned") # e.g. 'abandoned', 'recovered'
    
    customer = relationship("Customer", back_populates="abandoned_carts")
