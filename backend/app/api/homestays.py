from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.database.connection import get_db
from app.database.models import Homestay
from app.schemas.homestay import HomestayBase, HomestayListResponse
from app.services.gis_service import gis_service

router = APIRouter(prefix="/homestays", tags=["Homestays & PM-JUGA"])


@router.get("", response_model=HomestayListResponse)
async def list_homestays(
    state: Optional[str] = Query(None, description="Filter by state (e.g. 'Chhattisgarh')"),
    tribal_only: bool = Query(False, description="Filter only PM-JUGA tribal certified homestays"),
    min_sanitation_score: int = Query(70, ge=0, le=100, description="Minimum vision-audited cleanliness score"),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    List verified homestays with PM-JUGA tribal empowerment filter.
    """
    filters = [Homestay.sanitation_trust_score >= min_sanitation_score]

    if state and state.lower() != "all":
        filters.append(func.lower(Homestay.state) == state.strip().lower())

    if tribal_only:
        filters.append(Homestay.is_tribal_pmjuga == True)

    stmt = (
        select(Homestay)
        .where(and_(*filters))
        .order_by(Homestay.is_tribal_pmjuga.desc(), Homestay.sanitation_trust_score.desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    homestays = res.scalars().all()

    return HomestayListResponse(
        total=len(homestays),
        results=[HomestayBase.model_validate(h) for h in homestays]
    )


@router.get("/nearby")
async def nearby_homestays(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0),
    radius_km: float = Query(50.0, ge=1.0, le=200.0),
    tribal_only: bool = Query(False),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """
    Find nearby homestays around a given location with PM-JUGA prioritization.
    """
    results = await gis_service.find_nearby_homestays(
        session=db,
        lat=lat,
        lon=lon,
        radius_km=radius_km,
        tribal_only=tribal_only,
        limit=limit
    )
    return {
        "center": {"latitude": lat, "longitude": lon},
        "radius_km": radius_km,
        "count": len(results),
        "homestays": results
    }


@router.get("/{homestay_id}", response_model=HomestayBase)
async def get_homestay_detail(
    homestay_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve single homestay details with sanitation score and host info.
    """
    stmt = select(Homestay).where(Homestay.homestay_id == homestay_id)
    res = await db.execute(stmt)
    h = res.scalar_one_or_none()

    if not h:
        raise HTTPException(status_code=404, detail=f"Homestay ID {homestay_id} not found")

    return HomestayBase.model_validate(h)
