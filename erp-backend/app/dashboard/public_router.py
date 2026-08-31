from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db import get_db
from app.dashboard.models import PageVisit

router = APIRouter(tags=["analytics"])

class TrackVisitIn(BaseModel):
    path: str
    referrer: str = ""
    session_id: str

@router.post("/analytics/track")
def track_visit(payload: TrackVisitIn, db: Session = Depends(get_db)):
    visit = PageVisit(
        path=payload.path,
        referrer=payload.referrer,
        session_id=payload.session_id
    )
    db.add(visit)
    db.commit()
    return {"status": "success"}
