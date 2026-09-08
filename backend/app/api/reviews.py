"""
Reviews & Sentiment Trust Layer API Endpoints.
Provides DistilBERT SST-2 sentiment confidence and authenticity ratings,
with anti-fake review gating requiring a verified booking reference.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.services.review_service import ReviewService

router = APIRouter(tags=["Reviews & Trust Layer"])


class ReviewSubmitRequest(BaseModel):
    place_id: int = Field(..., description="Destination or POI ID")
    booking_id: str = Field(..., description="Confirmed booking reference (e.g. TS-UPI-123456)")
    author_name: str = Field("Verified Tourist", description="Author full name")
    rating: float = Field(5.0, ge=1.0, le=5.0, description="Rating from 1.0 to 5.0")
    review_text: str = Field(..., min_length=10, description="Authentic review text")


@router.get("/destinations/{destination_id}/reviews")
@router.get("/reviews/destination/{destination_id}")
async def get_destination_reviews(
    destination_id: int,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve verified tourist reviews with pre-computed DistilBERT SST-2 sentiment
    and authenticity trust scores for 0ms latency.
    """
    return await ReviewService.get_reviews_for_destination(db, destination_id=destination_id, limit=limit)


@router.post("/reviews/submit", status_code=status.HTTP_201_CREATED)
async def submit_verified_review(
    payload: ReviewSubmitRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a verified tourist review.
    Enforces strict anti-fake review gating: requests without a verified booking ID
    return HTTP 403 Forbidden.
    """
    result = await ReviewService.submit_verified_review(db, payload.model_dump())

    if "error" in result:
        status_code = result.get("status_code", 400)
        raise HTTPException(
            status_code=status_code,
            detail=result.get("message", "Review submission failed validation.")
        )

    return result


@router.get("/reviews/stats")
async def get_review_trust_stats(db: AsyncSession = Depends(get_db)):
    """
    Get platform-wide review trust index and fake review interception telemetry.
    """
    return await ReviewService.get_trust_stats(db)
