from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.db import get_db
from app.customers.models import Customer, AbandonedCart
from app.customers.schemas import (
    CustomerOut, CustomerCreate, AbandonedCartOut, 
    AbandonedCartCreate, TrackCartPayload, 
    BulkUploadResult, BulkUploadResultRow
)

router = APIRouter(tags=["Customers"])
public_router = APIRouter(tags=["Customers (Public)"])

@router.get("/customers", response_model=list[CustomerOut])
def get_customers(db: Session = Depends(get_db)):
    return db.query(Customer).options(joinedload(Customer.abandoned_carts)).all()

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

@router.post("/customers/bulk", response_model=BulkUploadResult)
def bulk_upload_customers(payload: list[CustomerCreate], db: Session = Depends(get_db)):
    success_count = 0
    error_count = 0
    details = []

    for i, row in enumerate(payload):
        # Validation checks
        existing_email = None
        existing_phone = None
        
        if row.email:
            existing_email = db.query(Customer).filter(Customer.email == row.email).first()
        if row.phone:
            existing_phone = db.query(Customer).filter(Customer.phone == row.phone).first()

        error_reason = None
        if existing_email:
            error_reason = f"email '{row.email}' already exists"
        elif existing_phone:
            error_reason = f"phone number '{row.phone}' already exists"

        if error_reason:
            error_count += 1
            details.append(BulkUploadResultRow(
                row_index=i + 1,
                name=row.name,
                status="error",
                error_reason=error_reason
            ))
            continue

        try:
            customer = Customer(**row.model_dump())
            db.add(customer)
            db.commit()
            success_count += 1
            details.append(BulkUploadResultRow(
                row_index=i + 1,
                name=row.name,
                status="success"
            ))
        except Exception as e:
            db.rollback()
            error_count += 1
            details.append(BulkUploadResultRow(
                row_index=i + 1,
                name=row.name,
                status="error",
                error_reason="Database error: " + str(e)
            ))

    return BulkUploadResult(
        success_count=success_count,
        error_count=error_count,
        details=details
    )

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
    else:
        # Update customer details if they provided new info
        if not customer.phone and phone:
            customer.phone = phone
        if not customer.address and payload.customer.get("address"):
            customer.address = payload.customer.get("address")
        db.commit()
        db.refresh(customer)
        
    # Check for existing abandoned cart for this customer
    existing_cart = db.query(AbandonedCart).filter(
        AbandonedCart.customer_id == customer.id,
        AbandonedCart.status == "abandoned"
    ).first()
    
    if existing_cart:
        existing_cart.items = payload.items
        # Touch the updated_at timestamp, but since we don't have updated_at, we can just commit
        db.commit()
    else:
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
