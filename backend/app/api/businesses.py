"""
TravelSathi — Tourism Businesses & Nearby Ecosystem Discovery API
Provides structured discovery for Accommodations (Hotels, Homestays, Guest Houses, Rest Houses)
and Dining (Restaurants, Cafes, Dhabas) around tourist places.
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, text

from app.database.connection import get_db
from app.database.models import DestinationMaster

router = APIRouter(prefix="/businesses", tags=["Tourism Businesses & Local Ecosystem"])

def get_current_hourly_token() -> str:
    return f"tok_hourly_{datetime.now(timezone.utc).strftime('%Y%m%d_%H00')}"

@router.get("/nearby")
async def get_nearby_businesses(
    tourist_place_id: Optional[str] = Query(None, description="Tourist Place ID e.g. DEST00001"),
    destination_name: Optional[str] = Query(None, description="Tourist Place Name e.g. Taj Mahal"),
    destination_id: Optional[int] = Query(None, description="Numeric Destination ID from destinations_master"),
    business_type: Optional[str] = Query(None, description="Filter by business type e.g. hotel, homestay, restaurant, cafe, dhaba"),
    category: Optional[str] = Query(None, description="Filter by category e.g. accommodation, food"),
    max_distance_km: float = Query(15.0, description="Max distance from destination in km"),
    min_rating: float = Query(3.5, description="Minimum visitor rating"),
    vegetarian_only: bool = Query(False, description="Filter for pure vegetarian food"),
    verified_only: bool = Query(False, description="Filter for verified establishments only"),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    """
    Query verified nearby tourism businesses (Hotels, Homestays, Restaurants, Cafes, Dhabas)
    connected to an anchor tourist destination.
    """
    hourly_token = get_current_hourly_token()

    # Resolve tourist place ID if destination_id or destination_name is provided
    effective_place_id = tourist_place_id
    effective_place_name = destination_name

    if not effective_place_id and destination_id:
        res_dest = await db.execute(select(DestinationMaster.name, DestinationMaster.state).where(DestinationMaster.id == destination_id))
        dest_row = res_dest.first()
        if dest_row:
            effective_place_name = dest_row[0]

    # Query businesses from tourism_businesses
    query_sql = """
        SELECT business_id, business_name, business_type, business_category, sub_category,
               description, tourist_place_id, tourist_place_name, destination_city, locality,
               district, state, address, latitude, longitude, distance_from_tourist_place_km,
               estimated_travel_time_minutes, rating, review_count, price_level, price_min_inr,
               price_max_inr, opening_time, closing_time, amenities, cuisines, vegetarian,
               family_friendly, couple_friendly, wheelchair_accessible, verified_business,
               image_url, booking_url
        FROM tourism_businesses
        WHERE 1=1
    """
    params: Dict[str, Any] = {"max_dist": max_distance_km, "min_rat": min_rating, "limit": limit}

    if effective_place_id:
        query_sql += " AND tourist_place_id = :place_id"
        params["place_id"] = effective_place_id
    elif effective_place_name:
        query_sql += " AND lower(tourist_place_name) LIKE :place_pat"
        params["place_pat"] = f"%{effective_place_name.strip().lower()}%"

    if business_type and business_type.lower() != "all":
        query_sql += " AND lower(business_type) = :b_type"
        params["b_type"] = business_type.strip().lower()

    if category and category.lower() != "all":
        query_sql += " AND lower(business_category) = :cat"
        params["cat"] = category.strip().lower()

    if vegetarian_only:
        query_sql += " AND vegetarian = 1"

    if verified_only:
        query_sql += " AND verified_business = 1"

    query_sql += " AND distance_from_tourist_place_km <= :max_dist AND rating >= :min_rat"
    query_sql += " ORDER BY distance_from_tourist_place_km ASC, rating DESC LIMIT :limit;"

    res = await db.execute(text(query_sql), params)
    rows = res.fetchall()

    businesses = []
    for r in rows:
        businesses.append({
            "business_id": r[0],
            "business_name": r[1],
            "business_type": r[2],
            "business_category": r[3],
            "sub_category": r[4],
            "description": r[5],
            "tourist_place_id": r[6],
            "tourist_place_name": r[7],
            "destination_city": r[8],
            "locality": r[9],
            "district": r[10],
            "state": r[11],
            "address": r[12],
            "latitude": r[13],
            "longitude": r[14],
            "distance_km": r[15],
            "estimated_travel_time_minutes": r[16],
            "rating": r[17],
            "review_count": r[18],
            "price_level": r[19],
            "price_min_inr": r[20],
            "price_max_inr": r[21],
            "opening_time": r[22],
            "closing_time": r[23],
            "amenities": r[24],
            "cuisines": r[25],
            "vegetarian": bool(r[26]),
            "family_friendly": bool(r[27]),
            "couple_friendly": bool(r[28]),
            "wheelchair_accessible": bool(r[29]),
            "verified_business": bool(r[30]),
            "image_url": r[31],
            "booking_url": r[32]
        })

    return {
        "count": len(businesses),
        "hourly_token": hourly_token,
        "businesses": businesses
    }


@router.get("/destinations/{destination_id}/ecosystem")
async def get_destination_ecosystem(
    destination_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Returns structured Stay Nearby (Hotels, Homestays, Guest Houses) and Eat Nearby (Restaurants, Cafes, Dhabas)
    for a given tourist destination.
    """
    hourly_token = get_current_hourly_token()

    # 1. Fetch Destination details
    res_dest = await db.execute(
        select(
            DestinationMaster.id,
            DestinationMaster.name,
            DestinationMaster.state,
            DestinationMaster.latitude,
            DestinationMaster.longitude,
            DestinationMaster.rating,
            DestinationMaster.category,
            DestinationMaster.image_url
        ).where(DestinationMaster.id == destination_id)
    )
    dest_row = res_dest.first()
    if not dest_row:
        raise HTTPException(status_code=404, detail="Destination not found")

    dest_name = dest_row[1]
    dest_state = dest_row[2]

    # Query businesses mapped to this destination or within the same destination locality
    query_sql = """
        SELECT business_id, business_name, business_type, business_category, sub_category,
               description, distance_from_tourist_place_km, estimated_travel_time_minutes,
               rating, review_count, price_level, price_min_inr, price_max_inr,
               amenities, cuisines, vegetarian, jain_food, family_friendly, couple_friendly,
               wheelchair_accessible, verified_business, image_url, booking_url, latitude, longitude
        FROM tourism_businesses
        WHERE (lower(tourist_place_name) LIKE :pat OR lower(state) = :state)
        ORDER BY distance_from_tourist_place_km ASC, rating DESC
        LIMIT 60;
    """
    res_biz = await db.execute(text(query_sql), {"pat": f"%{dest_name.strip().lower()}%", "state": dest_state.strip().lower()})
    biz_rows = res_biz.fetchall()

    stay_nearby = []
    eat_nearby = []

    for r in biz_rows:
        item = {
            "business_id": r[0],
            "name": r[1],
            "type": r[2],
            "category": r[3],
            "sub_category": r[4],
            "description": r[5],
            "distance_km": r[6],
            "travel_time_min": r[7],
            "rating": r[8],
            "review_count": r[9],
            "price_level": r[10],
            "price_min_inr": r[11],
            "price_max_inr": r[12],
            "amenities": r[13],
            "cuisines": r[14],
            "vegetarian": bool(r[15]),
            "jain_food": bool(r[16]),
            "family_friendly": bool(r[17]),
            "couple_friendly": bool(r[18]),
            "wheelchair_accessible": bool(r[19]),
            "verified": bool(r[20]),
            "image_url": r[21],
            "booking_url": r[22],
            "latitude": r[23],
            "longitude": r[24]
        }
        if r[3] == "accommodation":
            stay_nearby.append(item)
        else:
            eat_nearby.append(item)

    return {
        "destination_id": destination_id,
        "destination_name": dest_name,
        "state": dest_state,
        "hourly_token": hourly_token,
        "stay_nearby": stay_nearby[:20],
        "eat_nearby": eat_nearby[:20],
        "counts": {
            "stay_count": len(stay_nearby),
            "eat_count": len(eat_nearby),
            "total": len(stay_nearby) + len(eat_nearby)
        }
    }
