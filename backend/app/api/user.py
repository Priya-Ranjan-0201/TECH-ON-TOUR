from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database.connection import get_db
from app.database.models import SavedPlaceItem, DestinationMaster, UserInteraction, UserPreference
from app.core.auth_dependencies import get_optional_user, verify_user_ownership, User

router = APIRouter(prefix="/user", tags=["User Features & Preferences"])

class SavePlacePayload(BaseModel):
    user_id: str
    destination_id: int
    notes: Optional[str] = None

class UpdatePreferencesPayload(BaseModel):
    user_id: Optional[str] = None
    age_group: Optional[str] = None
    travel_style: Optional[str] = None
    budget_tier: Optional[str] = None
    budget: Optional[str] = None
    group_type: Optional[str] = None
    preferred_categories: Optional[str] = None
    food_preference: Optional[str] = None
    preferred_pace: Optional[str] = None
    pace: Optional[str] = None
    preferred_stay: Optional[str] = None
    accommodation: Optional[str] = None
    accessibility_requirements: Optional[str] = None
    personalization_active: Optional[bool] = None
    trip_duration_days: Optional[int] = None

@router.get("/saved")
async def get_saved_places(
    user_id: str = Query(..., description="User ID"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve all real saved destinations for a user with joined POI details from destinations_master.
    Enforces Application-Level RLS ownership check when authenticated.
    """
    if current_user:
        verify_user_ownership(user_id, current_user)
    stmt = (
        select(SavedPlaceItem, DestinationMaster)
        .join(DestinationMaster, SavedPlaceItem.destination_id == DestinationMaster.id)
        .where(
            SavedPlaceItem.user_id == user_id,
            DestinationMaster.image_url.isnot(None),
            DestinationMaster.image_url != ""
        )
        .order_by(SavedPlaceItem.created_at.desc())
    )
    res = await db.execute(stmt)
    rows = res.all()

    saved_destinations = []
    for item, dest in rows:
        saved_destinations.append({
            "saved_id": item.id,
            "destination_id": dest.id,
            "id": dest.id,
            "name": dest.name,
            "state": dest.state,
            "category": dest.category,
            "image": dest.image_url,
            "image_url": dest.image_url,
            "rating": dest.rating,
            "costAvgDay": dest.price_range,
            "is_hidden_gem": dest.is_hidden_gem,
            "saved_at": item.created_at.isoformat() if item.created_at else None,
            "notes": item.notes
        })

    return {
        "success": True,
        "count": len(saved_destinations),
        "saved_places": saved_destinations
    }

@router.post("/saved")
async def save_place(
    payload: SavePlacePayload,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add a destination to user's persistent bookmarks in SQLite.
    Enforces Application-Level RLS ownership check when authenticated.
    """
    if current_user:
        verify_user_ownership(payload.user_id, current_user)

    # Verify destination exists
    dest_stmt = select(DestinationMaster).where(DestinationMaster.id == payload.destination_id)
    dest_res = await db.execute(dest_stmt)
    dest = dest_res.scalar_one_or_none()
    if not dest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination ID {payload.destination_id} not found."
        )

    # Check if already saved
    existing_stmt = select(SavedPlaceItem).where(
        SavedPlaceItem.user_id == payload.user_id,
        SavedPlaceItem.destination_id == payload.destination_id
    )
    existing_res = await db.execute(existing_stmt)
    existing = existing_res.scalar_one_or_none()
    if existing:
        return {
            "success": True,
            "message": "Destination already bookmarked.",
            "saved_id": existing.id
        }

    new_saved = SavedPlaceItem(
        user_id=payload.user_id,
        destination_id=payload.destination_id,
        notes=payload.notes
    )
    db.add(new_saved)

    # Also log interaction signal for recommendation engine
    interaction = UserInteraction(
        user_id=payload.user_id,
        destination_id=payload.destination_id,
        action_type="save"
    )
    db.add(interaction)

    await db.commit()
    await db.refresh(new_saved)

    return {
        "success": True,
        "message": f"'{dest.name}' saved to your collection.",
        "saved_id": new_saved.id
    }

@router.delete("/saved/{destination_id}")
async def unsave_place(
    destination_id: int,
    user_id: str = Query(..., description="User ID"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove a destination from persistent bookmarks.
    Enforces Application-Level RLS ownership check when authenticated.
    """
    if current_user:
        verify_user_ownership(user_id, current_user)

    stmt = delete(SavedPlaceItem).where(
        SavedPlaceItem.user_id == user_id,
        SavedPlaceItem.destination_id == destination_id
    )
    result = await db.execute(stmt)
    await db.commit()

    return {
        "success": True,
        "message": f"Destination {destination_id} removed from saved places.",
        "deleted_count": result.rowcount
    }

@router.get("/history")
async def get_user_history(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(50, ge=1, le=200),
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve user interaction history (views, searches, saves, clicks) from user_interactions.
    Enforces Application-Level RLS ownership check when authenticated.
    """
    if current_user:
        verify_user_ownership(user_id, current_user)

    stmt = (
        select(UserInteraction, DestinationMaster)
        .join(DestinationMaster, UserInteraction.destination_id == DestinationMaster.id)
        .where(
            UserInteraction.user_id == user_id,
            DestinationMaster.image_url.isnot(None),
            DestinationMaster.image_url != ""
        )
        .order_by(UserInteraction.created_at.desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    rows = res.all()

    history_items = []
    for item, dest in rows:
        history_items.append({
            "interaction_id": item.id,
            "destination_id": dest.id,
            "destination_name": dest.name,
            "state": dest.state,
            "action_type": item.action_type,
            "timestamp": item.created_at.isoformat() if item.created_at else None,
            "image_url": dest.image_url
        })

    return {
        "success": True,
        "count": len(history_items),
        "history": history_items
    }

@router.delete("/history")
async def clear_user_history(
    user_id: str = Query(..., description="User ID"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Erase user interaction history under privacy regulations.
    Enforces Application-Level RLS ownership check when authenticated.
    """
    if current_user:
        verify_user_ownership(user_id, current_user)

    stmt = delete(UserInteraction).where(UserInteraction.user_id == user_id)
    res = await db.execute(stmt)
    await db.commit()
    return {
        "success": True,
        "message": "User history cleared successfully.",
        "deleted_count": res.rowcount
    }

@router.get("/preferences")
async def get_user_preferences(
    user_id: str = Query(..., description="User ID"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user profile preferences from user_preferences table.
    Enforces Application-Level RLS ownership check when authenticated.
    """
    if current_user:
        verify_user_ownership(user_id, current_user)

    stmt = select(UserPreference).where(UserPreference.user_id == user_id)
    res = await db.execute(stmt)
    pref = res.scalar_one_or_none()
    pref_dict = {
        "travel_style": pref.travel_style if pref and pref.travel_style else "Nature & Slow Travel",
        "budget_tier": pref.budget_tier if pref and pref.budget_tier else "Moderate (₹2,500 - ₹4,000/day)",
        "group_type": pref.group_type if pref and pref.group_type else "family",
        "preferred_categories": pref.preferred_categories if pref and pref.preferred_categories else "attraction,nature,heritage",
        "food_preference": pref.food_preference if pref and pref.food_preference else "Vegetarian Friendly & Regional Organic",
        "preferred_pace": pref.preferred_pace if pref and pref.preferred_pace else "Unrushed / Mindful",
        "pace": pref.preferred_pace if pref and pref.preferred_pace else "Unrushed / Mindful",
        "preferred_stay": pref.preferred_stay if pref and pref.preferred_stay else "Verified Eco-Homestays & Heritage Havelis",
        "accessibility_requirements": pref.accessibility_requirements if pref and pref.accessibility_requirements else "Low-impact stairs, step-free rooms",
        "personalization_active": pref.personalization_active if pref and pref.personalization_active is not None else True,
    }

    return {
        "success": True,
        "user_id": user_id,
        **pref_dict,
        "preferences": pref_dict
    }

async def _persist_user_preferences(
    target_user_id: str,
    payload: UpdatePreferencesPayload,
    current_user: Optional[User],
    db: AsyncSession
):
    eff_user_id = target_user_id or payload.user_id or (current_user.id if current_user else "usr-901")
    if current_user:
        verify_user_ownership(eff_user_id, current_user)

    stmt = select(UserPreference).where(UserPreference.user_id == eff_user_id)
    res = await db.execute(stmt)
    pref = res.scalar_one_or_none()

    if not pref:
        pref = UserPreference(user_id=eff_user_id)
        db.add(pref)

    if payload.travel_style is not None: pref.travel_style = payload.travel_style
    b_val = payload.budget_tier or payload.budget
    if b_val is not None: pref.budget_tier = b_val
    if payload.age_group is not None: pref.age_group = payload.age_group
    if payload.group_type is not None: pref.group_type = payload.group_type
    if payload.preferred_categories is not None: pref.preferred_categories = payload.preferred_categories
    if payload.food_preference is not None: pref.food_preference = payload.food_preference
    p_pace = payload.preferred_pace or payload.pace
    if p_pace is not None: pref.preferred_pace = p_pace
    stay_val = payload.preferred_stay or payload.accommodation
    if stay_val is not None: pref.preferred_stay = stay_val
    if payload.accessibility_requirements is not None: pref.accessibility_requirements = payload.accessibility_requirements
    if payload.personalization_active is not None: pref.personalization_active = payload.personalization_active

    await db.commit()
    await db.refresh(pref)

    pref_data = {
        "travel_style": pref.travel_style or "Nature & Slow Travel",
        "budget_tier": pref.budget_tier or "Moderate (₹2,500 - ₹4,000/day)",
        "group_type": pref.group_type or "family",
        "preferred_categories": pref.preferred_categories or "attraction,nature,heritage",
        "food_preference": pref.food_preference or "Vegetarian Friendly & Regional Organic",
        "preferred_pace": pref.preferred_pace or "Unrushed / Mindful",
        "pace": pref.preferred_pace or "Unrushed / Mindful",
        "preferred_stay": pref.preferred_stay or "Verified Eco-Homestays & Heritage Havelis",
        "accessibility_requirements": pref.accessibility_requirements or "Low-impact stairs, step-free rooms",
        "personalization_active": pref.personalization_active if pref.personalization_active is not None else True
    }

    return {
        "success": True,
        "status": "preferences_saved",
        "message": "Preferences saved successfully.",
        "user_id": eff_user_id,
        "travel_style": pref.travel_style,
        "budget": pref.budget_tier,
        **pref_data,
        "preferences": pref_data
    }


@router.post("/preferences")
@router.patch("/preferences")
async def update_user_preferences(
    payload: UpdatePreferencesPayload,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Persist updated user preferences into SQLite. Supports both POST and PATCH.
    """
    user_id = payload.user_id or (current_user.id if current_user else "usr-901")
    return await _persist_user_preferences(user_id, payload, current_user, db)


# ---------------------------------------------------------------------------
# Plural /users Router for REST compatibility (e.g. PATCH /api/users/{id}/preferences)
# ---------------------------------------------------------------------------
users_router = APIRouter(prefix="/users", tags=["Users Profile & Preferences"])

@users_router.get("/{user_id}/preferences")
async def get_user_preferences_by_path(
    user_id: str,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    return await get_user_preferences(user_id=user_id, current_user=current_user, db=db)

@users_router.patch("/{user_id}/preferences")
@users_router.post("/{user_id}/preferences")
async def patch_user_preferences_by_path(
    user_id: str,
    payload: UpdatePreferencesPayload,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    return await _persist_user_preferences(user_id, payload, current_user, db)


@router.get("/twin/{user_id}")
@users_router.get("/{user_id}/twin")
async def get_user_twin_profile(
    user_id: str,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve user AI Travel Twin profile with active preferences.
    """
    prefs = await get_user_preferences(user_id=user_id, current_user=current_user, db=db)
    return {
        "success": True,
        "user_id": user_id,
        "twin_id": f"twin-{user_id}",
        "preferences": prefs.get("preferences", {}),
        "status": "active"
    }

