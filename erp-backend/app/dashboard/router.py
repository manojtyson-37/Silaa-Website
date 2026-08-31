from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.dashboard.service import dashboard_summary

router = APIRouter(tags=["dashboard"])


class RecentEventOut(BaseModel):
    production_order_id: int
    event_type: str
    created_at: datetime
    created_by: str


class DashboardSummaryOut(BaseModel):
    open_production_orders: int
    draft_sales_orders: int
    fulfilled_sales_orders: int
    pending_purchase_orders: int
    recent_events: list[RecentEventOut]


@router.get("/dashboard/summary", response_model=DashboardSummaryOut)
def get_dashboard_summary(db: Session = Depends(get_db)):
    return dashboard_summary(db)

from datetime import timedelta
from sqlalchemy import func
from app.dashboard.models import PageVisit



class AnalyticsOut(BaseModel):
    total_views_30d: int
    unique_visitors_30d: int
    top_referrers: list[dict]

@router.get("/analytics/dashboard", response_model=AnalyticsOut)
def get_analytics(db: Session = Depends(get_db)):
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    total_views = db.query(PageVisit).filter(PageVisit.created_at >= thirty_days_ago).count()
    
    unique_visitors = db.query(func.count(func.distinct(PageVisit.session_id))).filter(
        PageVisit.created_at >= thirty_days_ago
    ).scalar() or 0
    
    # Top referrers
    # We'll filter out empty referrers and just take top 3
    referrers = db.query(
        PageVisit.referrer,
        func.count(PageVisit.id).label('count')
    ).filter(
        PageVisit.created_at >= thirty_days_ago,
        PageVisit.referrer != "",
        PageVisit.referrer != None
    ).group_by(PageVisit.referrer).order_by(func.count(PageVisit.id).desc()).limit(3).all()
    
    top_referrers = [{"referrer": r[0], "count": r[1]} for r in referrers]
    
    return {
        "total_views_30d": total_views,
        "unique_visitors_30d": unique_visitors,
        "top_referrers": top_referrers
    }
