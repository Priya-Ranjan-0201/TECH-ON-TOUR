import logging
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.schemas.itinerary import ItineraryRequest, ItineraryResponse
from app.services.itinerary_service import ItineraryService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/itinerary", tags=["AI Travel Twin Itinerary Generator"])


@router.post("/generate", response_model=ItineraryResponse, status_code=status.HTTP_201_CREATED)
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
    - Automatic persistence to database with unique UUID.
    """
    try:
        itinerary = await ItineraryService.generate_itinerary(db, request)
        return itinerary
    except Exception as exc:
        logger.error(f"Error generating itinerary: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate travel twin itinerary: {str(exc)}",
        )


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
