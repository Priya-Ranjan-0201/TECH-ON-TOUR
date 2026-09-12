"""Marketplace request/response schemas for RFPs, bids, and dynamic pricing."""

from typing import Optional
from pydantic import BaseModel, Field


class CreateRFPRequest(BaseModel):
    itinerary_id: Optional[str] = None
    traveler_name: str = Field("Priya Sharma", description="Traveler primary name")
    traveler_phone: str = Field("+91 98765 43210", description="Traveler contact phone")
    destination: str = Field(..., description="Target destination city/region")
    state: str = Field(..., description="Target state/UT")
    days: int = Field(3, ge=1, le=14, description="Duration in days")
    target_budget_inr: float = Field(..., gt=0, description="Target total budget in INR")
    notes: Optional[str] = Field(None, description="Custom preferences or dietary needs")


class SubmitBidRequest(BaseModel):
    rfp_id: str = Field(..., description="ID of open RFP")
    host_id: str = Field("host-bastar-01", description="Verified host identifier")
    host_name: str = Field("Mangal Mandavi", description="Host full name")
    homestay_name: Optional[str] = Field("Bastar Dhokra Craft & Forest Homestay", description="Homestay title")
    bid_amount_inr: float = Field(..., gt=0, description="Proposed total quote in INR")
    inclusions: str = Field(..., description="What is included (meals, guiding, cultural immersion)")
    message: Optional[str] = Field(None, description="Personal welcome note from host")


class ApplyPricingRequest(BaseModel):
    host_id: str = Field("host-bastar-01", description="Host identifier")
    state: str = Field("Chhattisgarh", description="Host state")
    new_tariff_inr: float = Field(..., gt=0, description="Updated base room tariff in INR")
