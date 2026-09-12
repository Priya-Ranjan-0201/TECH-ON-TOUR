"""
TravelSathi Recommendations & Location Services API (V2.0 Master Upgrade).
Exposes endpoints for personalized Netflix-style rails, GPS sessions, and feedback learning.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.connection import get_db
from app.database.models import (
    UserPreference, UserInteraction, LocationShareSession, LocationPing,
    DestinationMaster, DestinationInteraction, LiveLocation
)
from app.services.recommendation_service import recommendation_engine, haversine_distance_km

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations & GPS"])
location_router = APIRouter(prefix="/api/location", tags=["GPS Live Tracking"])


class UserPreferenceUpdate(BaseModel):
    user_id: str
    age_group: Optional[str] = "26-40"
    travel_style: Optional[str] = "nature"
    group_type: Optional[str] = "family"
    preferred_categories: Optional[str] = "attraction,nature,heritage"
    budget_tier: Optional[str] = "mid"
    food_preference: Optional[str] = "vegetarian"


class InteractionEvent(BaseModel):
    user_id: str
    destination_id: int
    action_type: str  # 'view', 'click', 'save', 'skip', 'visit', 'rate', 'book'
    dwell_time_seconds: Optional[int] = 0
    rating: Optional[float] = None
    context_metadata: Optional[Dict[str, Any]] = None


class LocationSessionCreate(BaseModel):
    owner_user_id: str
    trip_id: Optional[str] = None
    sharing_mode: str = "live_navigation"  # 'off', 'one_time', 'live_navigation', 'group_sharing', 'trip_track'
    allowed_members: Optional[List[str]] = []


class LocationPingPayload(BaseModel):
    session_id: str
    latitude: float
    longitude: float
    accuracy_meters: Optional[float] = 10.0
    speed_mps: Optional[float] = None
    heading_degrees: Optional[float] = None


@router.get("/rails")
async def get_recommendation_rails(
    lat: Optional[float] = Query(None, description="Current latitude if permission granted"),
    lng: Optional[float] = Query(None, description="Current longitude if permission granted"),
    user_id: Optional[str] = Query("usr-901", description="User ID for personalization"),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns personalized recommendation rails (Best for Season, Near You, Recommended For You,
    Because You Liked, Hidden Gems, Perfect For Today, Trending) with diversity & explanations.
    """
    try:
        rails_data = await recommendation_engine.get_rails(db, user_id=user_id, lat=lat, lng=lng)
        return rails_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendation rails: {str(e)}")


@router.post("/feedback")
async def record_interaction_feedback(
    event: InteractionEvent,
    db: AsyncSession = Depends(get_db)
):
    """
    Records behavioral interaction signals (view, click, save, skip, rate) to continuously
    train and refine personalized ranking scores.
    """
    import json
    metadata_str = json.dumps(event.context_metadata) if event.context_metadata else None
    interaction = UserInteraction(
        user_id=event.user_id,
        destination_id=event.destination_id,
        action_type=event.action_type,
        dwell_time_seconds=event.dwell_time_seconds or 0,
        rating=event.rating,
        context_metadata=metadata_str
    )
    db.add(interaction)
    await db.commit()
    return {"status": "recorded", "action_type": event.action_type, "user_id": event.user_id}


@router.get("/preferences/{user_id}")
async def get_user_preferences(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves user profile preferences.
    """
    res = await db.execute(select(UserPreference).where(UserPreference.user_id == user_id))
    pref = res.scalar_one_or_none()
    if not pref:
        return {
            "user_id": user_id,
            "age_group": "26-40",
            "travel_style": "nature",
            "group_type": "family",
            "preferred_categories": "attraction,nature,heritage",
            "budget_tier": "mid",
            "food_preference": "vegetarian"
        }
    return {
        "user_id": pref.user_id,
        "age_group": pref.age_group,
        "travel_style": pref.travel_style,
        "group_type": pref.group_type,
        "preferred_categories": pref.preferred_categories,
        "budget_tier": pref.budget_tier,
        "food_preference": pref.food_preference
    }


@router.post("/preferences")
async def update_user_preferences(
    payload: UserPreferenceUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Creates or updates user preferences for personalized ranking.
    """
    res = await db.execute(select(UserPreference).where(UserPreference.user_id == payload.user_id))
    pref = res.scalar_one_or_none()
    if not pref:
        pref = UserPreference(
            user_id=payload.user_id,
            age_group=payload.age_group,
            travel_style=payload.travel_style,
            group_type=payload.group_type,
            preferred_categories=payload.preferred_categories,
            budget_tier=payload.budget_tier,
            food_preference=payload.food_preference
        )
        db.add(pref)
    else:
        pref.age_group = payload.age_group or pref.age_group
        pref.travel_style = payload.travel_style or pref.travel_style
        pref.group_type = payload.group_type or pref.group_type
        pref.preferred_categories = payload.preferred_categories or pref.preferred_categories
        pref.budget_tier = payload.budget_tier or pref.budget_tier
        pref.food_preference = payload.food_preference or pref.food_preference

    await db.commit()
    return {"status": "updated", "user_id": payload.user_id}


@router.post("/location-session")
async def start_location_session(
    payload: LocationSessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Starts an explicit, user-authorized live GPS sharing session.
    """
    import json
    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc)
    expires = now + timedelta(hours=8)  # Strict hourly TTL retention limit

    session = LocationShareSession(
        owner_user_id=payload.owner_user_id,
        trip_id=payload.trip_id,
        sharing_mode=payload.sharing_mode,
        is_active=True,
        allowed_members_json=json.dumps(payload.allowed_members or []),
        started_at=now,
        expires_at=expires
    )
    db.add(session)
    await db.commit()
    return {
        "status": "session_created",
        "session_id": session.session_id,
        "mode": session.sharing_mode,
        "expires_in_hours": 8
    }


@router.post("/location-ping")
async def record_location_ping(
    payload: LocationPingPayload,
    db: AsyncSession = Depends(get_db)
):
    """
    Records a live GPS ping and checks for geofenced arrival proximity (< 500m) to planned destinations.
    """
    ping = LocationPing(
        session_id=payload.session_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        accuracy_meters=payload.accuracy_meters or 10.0,
        speed_mps=payload.speed_mps,
        heading_degrees=payload.heading_degrees
    )
    db.add(ping)
    await db.commit()

    # Geofence arrival check against nearest destination
    stmt = (
        select(DestinationMaster)
        .where(
            DestinationMaster.latitude.between(payload.latitude - 0.05, payload.latitude + 0.05),
            DestinationMaster.longitude.between(payload.longitude - 0.05, payload.longitude + 0.05)
        )
        .limit(3)
    )
    res = await db.execute(stmt)
    nearby_dests = res.scalars().all()

    arrival_alert = None
    for d in nearby_dests:
        dist = haversine_distance_km(payload.latitude, payload.longitude, d.latitude, d.longitude)
        if dist <= 0.6:  # within 600m geofence
            arrival_alert = {
                "destination_id": d.id,
                "name": d.name,
                "state": d.state,
                "distance_km": dist,
                "is_arrived": dist <= 0.2,
                "message": f"You're near {d.name} ({int(dist * 1000)}m away)",
                "category": d.category,
                "safety_score": d.safety_score,
                "image_url": d.image_url
            }
            break

    return {
        "status": "ping_recorded",
        "arrival_alert": arrival_alert
    }


class DirectLocationPing(BaseModel):
    user_id: str
    latitude: float
    longitude: float


class InteractionLogRequest(BaseModel):
    user_id: str
    destination_id: int
    interaction_type: str = "view"  # 'view', 'search', 'book', 'itinerary_include', 'click', 'save'


async def _handle_live_ping(payload: DirectLocationPing, db: AsyncSession):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    res = await db.execute(select(LiveLocation).where(LiveLocation.user_id == payload.user_id))
    live_loc = res.scalar_one_or_none()
    if live_loc:
        live_loc.latitude = payload.latitude
        live_loc.longitude = payload.longitude
        live_loc.updated_at = now
    else:
        live_loc = LiveLocation(
            user_id=payload.user_id,
            latitude=payload.latitude,
            longitude=payload.longitude,
            updated_at=now
        )
        db.add(live_loc)
    await db.commit()

    # Arrival proximity geofence check (< 600m)
    stmt = (
        select(DestinationMaster)
        .where(
            DestinationMaster.latitude.between(payload.latitude - 0.05, payload.latitude + 0.05),
            DestinationMaster.longitude.between(payload.longitude - 0.05, payload.longitude + 0.05)
        )
        .limit(3)
    )
    res_dest = await db.execute(stmt)
    nearby_dests = res_dest.scalars().all()
    arrival_alert = None
    for d in nearby_dests:
        dist = haversine_distance_km(payload.latitude, payload.longitude, d.latitude, d.longitude)
        if dist <= 0.6:
            arrival_alert = {
                "destination_id": d.id,
                "name": d.name,
                "state": d.state,
                "distance_km": dist,
                "is_arrived": dist <= 0.2,
                "message": f"You're near {d.name} ({int(dist * 1000)}m away)",
                "category": d.category,
                "safety_score": d.safety_score,
                "image_url": d.image_url
            }
            break

    return {
        "status": "location_updated",
        "user_id": payload.user_id,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "arrival_alert": arrival_alert
    }


@router.post("/ping")
async def ping_recommendations_location(
    payload: DirectLocationPing,
    db: AsyncSession = Depends(get_db)
):
    """
    Direct GPS ping for recommendations engine, updating user's ephemeral live coordinates.
    """
    return await _handle_live_ping(payload, db)


@location_router.post("/ping")
async def ping_live_location(
    payload: DirectLocationPing,
    db: AsyncSession = Depends(get_db)
):
    """
    Direct GPS ping endpoint mounted at /api/location/ping.
    """
    return await _handle_live_ping(payload, db)


@router.post("/interaction")
@router.post("/interactions")
async def log_destination_interaction(
    payload: InteractionLogRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Logs an interaction row (view, search, book, itinerary_include, click, save)
    into destination_interactions and user_interactions to train recommendation ranking.
    """
    dest_inter = DestinationInteraction(
        user_id=payload.user_id,
        destination_id=payload.destination_id,
        interaction_type=payload.interaction_type
    )
    db.add(dest_inter)

    user_inter = UserInteraction(
        user_id=payload.user_id,
        destination_id=payload.destination_id,
        action_type=payload.interaction_type,
        dwell_time_seconds=5
    )
    db.add(user_inter)

    await db.commit()
    return {
        "status": "interaction_logged",
        "user_id": payload.user_id,
        "destination_id": payload.destination_id,
        "interaction_type": payload.interaction_type
    }


@router.get("/live/{user_id}")
@location_router.get("/live/{user_id}")
async def get_user_live_coords(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves user's last known live location coordinates.
    """
    res = await db.execute(select(LiveLocation).where(LiveLocation.user_id == user_id))
    loc = res.scalar_one_or_none()
    if not loc:
        return {"status": "not_found", "user_id": user_id, "has_location": False}
    return {
        "status": "success",
        "user_id": loc.user_id,
        "has_location": True,
        "latitude": loc.latitude,
        "longitude": loc.longitude,
        "updated_at": loc.updated_at.isoformat() if loc.updated_at else None
    }


@router.get("/{row_type}")
async def get_recommendations_by_row(
    row_type: str,
    user_id: Optional[str] = Query("usr-901", description="User ID"),
    lat: Optional[float] = Query(None, description="Current latitude"),
    lng: Optional[float] = Query(None, description="Current longitude"),
    month: Optional[int] = Query(None, ge=1, le=12, description="Simulated current month (1-12)"),
    exclude_ids: Optional[str] = Query(None, description="Comma-separated IDs already shown elsewhere to deduplicate"),
    limit: Optional[int] = Query(6, description="Card count"),
    db: AsyncSession = Depends(get_db)
):
    """
    Serves individual Netflix/Hotstar horizontal recommendation rows:
    - 'seasonal': "Because it's [current season] in India" (season_match pre-filtered)
    - 'nearby': "Near [User's current/last-known location]" (under 150km spatial pre-filtered)
    - 'history': "Because you explored [category]" (user past category pre-filtered)
    - 'trending': "Trending with travelers like you" (global_popularity_30d sorted)
    - 'personal' / 'for_you': "Good morning, [Name] — here's what's calling you this season"
    """
    parsed_exclude = []
    if exclude_ids:
        for part in exclude_ids.split(","):
            part = part.strip()
            if part.isdigit():
                parsed_exclude.append(int(part))

    try:
        data = await recommendation_engine.get_row_by_type(
            session=db,
            row_type=row_type,
            user_id=user_id or "usr-901",
            lat=lat,
            lng=lng,
            month=month,
            exclude_ids=parsed_exclude,
            limit=limit or 6
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate row recommendations: {str(e)}")
