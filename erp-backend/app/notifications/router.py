from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import RequireRole
from app.db import get_db
from app.notifications.models import Notification

router = APIRouter(tags=["notifications"], dependencies=[Depends(RequireRole(["admin"]))])


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    link_url: Optional[str] = None
    is_read: bool
    created_at: datetime


@router.get("/notifications", response_model=List[NotificationOut])
def list_notifications(db: Session = Depends(get_db)):
    # Return the latest 50 notifications, ordered by creation date descending
    notifications = db.execute(
        select(Notification).order_by(Notification.created_at.desc()).limit(50)
    ).scalars().all()
    return notifications


@router.get("/notifications/unread-count")
def unread_count(db: Session = Depends(get_db)):
    count = db.query(Notification).filter(Notification.is_read == False).count()
    return {"count": count}


@router.patch("/notifications/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    notification = db.get(Notification, notification_id)
    if not notification:
        raise HTTPException(404, "Notification not found")
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.post("/notifications/mark-all-read")
def mark_all_read(db: Session = Depends(get_db)):
    unread_notifications = db.query(Notification).filter(Notification.is_read == False).all()
    for n in unread_notifications:
        n.is_read = True
    db.commit()
    return {"status": "success", "marked_count": len(unread_notifications)}
