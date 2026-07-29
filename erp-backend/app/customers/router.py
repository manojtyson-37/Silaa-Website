from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.customers.models import Customer, AbandonedCart
from app.customers.schemas import CustomerOut, CustomerCreate, AbandonedCartOut, AbandonedCartCreate, TrackCartPayload

router = APIRouter(tags=["Customers"])
public_router = APIRouter(tags=["Customers (Public)"])

@router.get("/customers", response_model=list[CustomerOut])
def get_customers(db: Session = Depends(get_db)):
    return db.query(Customer).all()

@router.post("/customers", response_model=CustomerOut)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    # Check if email exists
    if payload.email:
        existing = db.query(Customer).filter(Customer.email == payload.email).first()
        if existing:
            raise HTTPException(400, "Customer with this email already exists")
            
    customer = Customer(**payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@public_router.post("/customers/track-cart")
def track_cart(payload: TrackCartPayload, db: Session = Depends(get_db)):
    email = payload.customer.get("email")
    phone = payload.customer.get("phone")
    if not email and not phone:
        raise HTTPException(400, "Email or phone required")
    
    customer = None
    if email:
        customer = db.query(Customer).filter(Customer.email == email).first()
    if not customer and phone:
        customer = db.query(Customer).filter(Customer.phone == phone).first()
        
    if not customer:
        customer = Customer(
            name=payload.customer.get("name") or "Guest",
            email=email,
            phone=phone,
            address=payload.customer.get("address")
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        
    cart = AbandonedCart(
        customer_id=customer.id,
        items=payload.items,
        status="abandoned"
    )
    db.add(cart)
    db.commit()
    
    return {"status": "ok"}

@router.post("/customers/{customer_id}/abandoned-carts", response_model=AbandonedCartOut)
def add_abandoned_cart(customer_id: int, payload: AbandonedCartCreate, db: Session = Depends(get_db)):
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(404, "Customer not found")
        
    cart = AbandonedCart(
        customer_id=customer_id,
        items=payload.items,
        status=payload.status
    )
    db.add(cart)
    db.commit()
    db.refresh(cart)
    return cart

@router.delete("/customers/{customer_id}", status_code=204)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(404, "Customer not found")
    db.delete(customer)
    db.commit()
