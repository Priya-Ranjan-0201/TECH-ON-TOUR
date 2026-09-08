import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from app.database.connection import get_db
from app.database.models import DestinationMaster, ReviewTraining
from app.schemas.destination import (
    DestinationBase,
    DestinationListResponse,
    DestinationDetailResponse,
    NearbyQueryResponse,
    StatesListResponse,
    StateCountItem,
    ReviewResponse
)
from app.services.gis_service import gis_service

router = APIRouter(prefix="/destinations", tags=["Destinations & Catalog"])


@router.get("", response_model=DestinationListResponse)
async def list_destinations(
    state: Optional[str] = Query(None, description="Filter by Indian State/UT (e.g. 'Himachal Pradesh')"),
    category: Optional[str] = Query(None, description="Filter by category ('attraction', 'hotel', 'homestay', 'restaurant')"),
    price_range: Optional[str] = Query(None, description="Filter by price tier ('budget', 'mid', 'luxury')"),
    search: Optional[str] = Query(None, description="Keyword search in destination name or description"),
    is_hidden_gem: Optional[bool] = Query(None, description="Filter only anti-overtourism hidden gems"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db)
):
    """
    Search and filter across 12,293 verified destinations with pagination.
    """
    filters = []

    if state and state.lower() != "all":
        filters.append(func.lower(DestinationMaster.state) == state.strip().lower())

    if category and category.lower() != "all":
        filters.append(func.lower(DestinationMaster.category) == category.strip().lower())

    if price_range and price_range.lower() != "all":
        filters.append(func.lower(DestinationMaster.price_range) == price_range.strip().lower())

    if is_hidden_gem is not None:
        filters.append(DestinationMaster.is_hidden_gem == is_hidden_gem)

    if search:
        search_pattern = f"%{search.strip().lower()}%"
        filters.append(
            or_(
                func.lower(DestinationMaster.name).like(search_pattern),
                func.lower(DestinationMaster.description).like(search_pattern),
            )
        )

    # Count total matching rows
    count_stmt = select(func.count()).select_from(DestinationMaster)
    if filters:
        count_stmt = count_stmt.where(and_(*filters))
    total_res = await db.execute(count_stmt)
    total = total_res.scalar() or 0

    # Fetch paginated rows
    offset = (page - 1) * limit
    data_stmt = (
        select(DestinationMaster)
        .where(and_(*filters)) if filters else select(DestinationMaster)
    )
    data_stmt = data_stmt.order_by(DestinationMaster.rating.desc(), DestinationMaster.id.asc()).offset(offset).limit(limit)

    data_res = await db.execute(data_stmt)
    rows = data_res.scalars().all()

    total_pages = math.ceil(total / limit) if total > 0 else 1

    return DestinationListResponse(
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
        results=[DestinationBase.model_validate(r) for r in rows]
    )


@router.get("/states", response_model=StatesListResponse)
async def list_states(db: AsyncSession = Depends(get_db)):
    """
    Retrieve all distinct Indian States & UTs with destination counts.
    """
    stmt = (
        select(DestinationMaster.state, func.count(DestinationMaster.id).label("dest_count"))
        .group_by(DestinationMaster.state)
        .order_by(DestinationMaster.state.asc())
    )
    res = await db.execute(stmt)
    states_data = [
        StateCountItem(state=row[0], destination_count=row[1])
        for row in res.all()
    ]
    return StatesListResponse(
        total_states=len(states_data),
        states=states_data
    )


@router.get("/nearby", response_model=NearbyQueryResponse)
async def nearby_destinations(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees"),
    radius_km: float = Query(25.0, ge=1.0, le=200.0, description="Search radius in kilometers"),
    category: Optional[str] = Query(None, description="Optional category filter"),
    limit: int = Query(15, ge=1, le=50, description="Max places to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Execute indexed high-performance spatial proximity query (<25ms).
    """
    places = await gis_service.find_nearby_destinations(
        session=db,
        lat=lat,
        lon=lon,
        radius_km=radius_km,
        category=category,
        limit=limit
    )

    return NearbyQueryResponse(
        center={"latitude": lat, "longitude": lon},
        radius_km=radius_km,
        count=len(places),
        places=places
    )


@router.get("/{destination_id}", response_model=DestinationDetailResponse)
async def get_destination_detail(
    destination_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve POI details with pre-computed review trust scores.
    """
    stmt = select(DestinationMaster).where(DestinationMaster.id == destination_id)
    res = await db.execute(stmt)
    dest = res.scalar_one_or_none()

    if not dest:
        raise HTTPException(status_code=404, detail=f"Destination ID {destination_id} not found")

    # Fetch associated verified reviews
    rev_stmt = (
        select(ReviewTraining)
        .where(ReviewTraining.place_id == destination_id)
        .order_by(ReviewTraining.rating.desc())
    )
    rev_res = await db.execute(rev_stmt)
    reviews = rev_res.scalars().all()

    return DestinationDetailResponse(
        destination=DestinationBase.model_validate(dest),
        verified_reviews=[ReviewResponse.model_validate(r) for r in reviews]
    )
