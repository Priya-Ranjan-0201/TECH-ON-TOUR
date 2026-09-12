"""Review request/response schemas for the Reviews & Trust Layer."""

from pydantic import BaseModel, Field


class ReviewSubmitRequest(BaseModel):
    place_id: int = Field(..., description="Destination or POI ID")
    booking_id: str = Field(..., description="Confirmed booking reference (e.g. TS-UPI-123456)")
    author_name: str = Field("Verified Tourist", description="Author full name")
    rating: float = Field(5.0, ge=1.0, le=5.0, description="Rating from 1.0 to 5.0")
    review_text: str = Field(..., min_length=10, description="Authentic review text")
