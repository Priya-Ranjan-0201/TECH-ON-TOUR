from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database.connection import get_db
from app.database.models import AntiOvertourismPair
from app.schemas.insights import AntiOvertourismListResponse, AntiOvertourismItem

router = APIRouter(prefix="/anti-overtourism", tags=["Anti-Overtourism & Sustainability"])


@router.get("/alternatives", response_model=AntiOvertourismListResponse)
async def get_alternatives(
    popular_destination: Optional[str] = Query(None, description="Popular hotspot name (e.g. 'Manali', 'Shimla', 'Ooty')"),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve curated anti-overtourism alternative circuits that divert footfall
    from congested tourist hotspots to nearby culturally rich hidden gems.
    """
    stmt = select(AntiOvertourismPair)

    if popular_destination:
        # Escape SQL LIKE wildcards in user input to prevent unintended pattern matching
        safe_input = popular_destination.strip().lower().replace("%", "\\%").replace("_", "\\_")
        stmt = stmt.where(func.lower(AntiOvertourismPair.popular_name).like(f"%{safe_input}%"))

    res = await db.execute(stmt)
    pairs = res.scalars().all()

    return AntiOvertourismListResponse(
        count=len(pairs),
        circuits=[AntiOvertourismItem.model_validate(p) for p in pairs]
    )


@router.get("/predict-risk")
async def get_overtourism_risk(
    review_count: int = Query(..., ge=0, description="Total verified user reviews"),
    rating: float = Query(4.0, ge=1.0, le=5.0, description="Average review rating"),
    latitude: float = Query(20.0, description="Destination latitude"),
    longitude: float = Query(78.0, description="Destination longitude"),
    category: str = Query("attraction", description="Destination category (e.g. 'attraction', 'nature', 'spiritual')"),
):
    """
    ML Model 3: Evaluates carrying capacity saturation and overtourism risk using
    RandomForestClassifier trained across 12,293 national destinations.
    """
    from app.services.overtourism_service import predict_overtourism_risk
    return predict_overtourism_risk(review_count, rating, latitude, longitude, category)


@router.post("/predict-risk")
async def post_overtourism_risk(payload: dict):
    """
    ML Model 3 POST endpoint for bulk or JSON-payload overtourism risk evaluation.
    """
    from app.services.overtourism_service import predict_overtourism_risk
    rev_count = payload.get("review_count", 100)
    rating = payload.get("rating", 4.0)
    lat = payload.get("latitude", 20.0)
    lng = payload.get("longitude", 78.0)
    category = payload.get("category", "attraction")
    return predict_overtourism_risk(rev_count, rating, lat, lng, category)

