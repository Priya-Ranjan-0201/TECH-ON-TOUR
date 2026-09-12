import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.schemas.itinerary import (
    AlternativeStop,
    ConvertToRFPRequest,
    ItineraryRequest,
    ItineraryResponse,
    ReorderStopsRequest,
    SwapStopRequest,
)
from app.services.itinerary_service import ItineraryService
from app.core.rate_limit import rate_limit_itinerary

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/itinerary", tags=["AI Travel Twin Itinerary Generator"])


@router.post("/generate", response_model=ItineraryResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(rate_limit_itinerary)])
async def generate_itinerary(
    request: ItineraryRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a personalized multi-day travel twin schedule.
    Features:
    - Grounded in 12,293 real verified Indian destinations.
    - Google Gemini 1.5 Flash structured generation with strict 3.5s timeout circuit breaker.
    - Automatic zero-latency fallback to Deterministic Spatial Graph Solver.
    - TransitGuard municipal fare auditing & EcoFootprint calculations.
    - Regional culinary highlights & PM-JUGA homestay recommendations.
    - Automatic persistence to database with unique UUID.
    """
    try:
        itinerary = await ItineraryService.generate_itinerary(db, request)
        return itinerary
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error generating itinerary: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate travel twin itinerary: {str(exc)}",
        )


@router.get("/user/{user_id}")
async def get_user_itineraries(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch all multi-day itineraries created by a user from the database.
    """
    from app.database.models import Itinerary
    from sqlalchemy import select
    import json
    stmt = select(Itinerary).where(Itinerary.user_id == user_id).order_by(Itinerary.created_at.desc())
    res = await db.execute(stmt)
    rows = res.scalars().all()

    trips = []
    for it in rows:
        try:
            plan = json.loads(it.plan_json)
        except Exception:
            plan = {}
        trips.append({
            "id": it.id,
            "title": f"{it.days}-Day {it.destination} Itinerary",
            "destination": it.destination,
            "days": it.days,
            "budget": it.budget,
            "interests": it.interests,
            "status": "Saved",
            "created_at": it.created_at.isoformat() if it.created_at else None,
            "schedule": plan
        })

    return {
        "success": True,
        "count": len(trips),
        "trips": trips
    }


@router.get("/samples", response_model=List[Dict])
async def get_sample_itineraries():
    """
    Return curated showcase circuits (Rajasthan, Himachal, Kerala)
    for instant 0ms demo presentation.
    """
    return ItineraryService.get_curated_samples()


@router.get("/{itinerary_id}", response_model=ItineraryResponse)
async def get_saved_itinerary(
    itinerary_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch a saved itinerary by its UUID for persistent sharing
    and hard refresh recovery.
    """
    itinerary = await ItineraryService.get_itinerary_by_id(db, itinerary_id)
    if not itinerary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Itinerary with ID '{itinerary_id}' not found.",
        )
    return itinerary


@router.get("/{itinerary_id}/alternatives", response_model=List[AlternativeStop])
async def get_stop_alternatives(
    itinerary_id: str,
    day_number: int = Query(..., ge=1, le=7),
    stop_index: int = Query(..., ge=0, le=10),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch candidate replacement destinations for a specific stop slot.
    Allows tourists to swap any stop with an alternative verified POI in the region.
    """
    alternatives = await ItineraryService.get_stop_alternatives(
        db, itinerary_id, day_number, stop_index
    )
    return alternatives


@router.post("/{itinerary_id}/swap-stop", response_model=ItineraryResponse)
async def swap_itinerary_stop(
    itinerary_id: str,
    payload: SwapStopRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Replace a stop on the itinerary with a selected destination.
    Automatically recalculates geodesic distances, TransitGuard fare caps,
    and the itinerary EcoFootprint.
    """
    updated = await ItineraryService.swap_stop(db, itinerary_id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to swap stop. Verify itinerary ID, day number, stop index, and destination ID.",
        )
    return updated


@router.post("/{itinerary_id}/reorder-stops", response_model=ItineraryResponse)
async def reorder_itinerary_stops(
    itinerary_id: str,
    payload: ReorderStopsRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Reorder stops on a specific day according to user preference.
    Recalculates transit legs, optimal time slots, and carbon impact.
    """
    updated = await ItineraryService.reorder_stops(db, itinerary_id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to reorder stops. Verify day number and new stop order array.",
        )
    return updated


@router.get("/{itinerary_id}/export/ics")
async def export_itinerary_ics(
    itinerary_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate and serve standard RFC 5545 iCalendar (.ics) stream
    for 1-click calendar sync with Google Calendar, Apple Calendar, and Outlook.
    """
    itinerary = await ItineraryService.get_itinerary_by_id(db, itinerary_id)
    if not itinerary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Itinerary with ID '{itinerary_id}' not found.",
        )

    ics_content = ItineraryService.generate_ics_calendar(itinerary)
    headers = {
        "Content-Disposition": f'attachment; filename="travelsathi-{itinerary.id}.ics"',
    }
    return Response(content=ics_content, media_type="text/calendar", headers=headers)


@router.post("/{itinerary_id}/rfp", response_model=Dict[str, Any])
async def convert_itinerary_to_rfp(
    itinerary_id: str,
    payload: ConvertToRFPRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Convert the generated itinerary into a community Travel RFP,
    broadcasting to verified local homestay hosts and guides for direct bidding (Phase 6 Bridge).
    """
    rfp_receipt = await ItineraryService.convert_to_rfp(db, itinerary_id, payload)
    if "error" in rfp_receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=rfp_receipt["error"],
        )
    return rfp_receipt


@router.delete("/{itinerary_id}")
async def delete_saved_itinerary(
    itinerary_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a saved itinerary by its UUID.
    """
    from app.database.models import Itinerary
    from sqlalchemy import select
    stmt = select(Itinerary).where(Itinerary.id == itinerary_id)
    res = await db.execute(stmt)
    item = res.scalars().first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Itinerary with ID '{itinerary_id}' not found.",
        )
    await db.delete(item)
    await db.commit()
    return {"success": True, "message": f"Itinerary {itinerary_id} deleted."}

