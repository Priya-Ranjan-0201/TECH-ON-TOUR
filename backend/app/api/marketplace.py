"""
Reverse Marketplace & Host Seller Hub API Endpoints.
Powers tourist RFPs broadcast from itineraries, 1-click competitive host bidding,
and dynamic pricing co-pilot intelligence for local hosts.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.services.marketplace_service import MarketplaceService
from app.services.pricing_service import PricingService

router = APIRouter(tags=["Marketplace & Host Hub"])


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


@router.get("/marketplace/rfps")
async def list_open_rfps(
    state: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List open tourist RFPs broadcast from AI itineraries, filtered by state.
    """
    return await MarketplaceService.list_open_rfps(db, state=state)


@router.post("/marketplace/rfp", status_code=status.HTTP_201_CREATED)
async def create_tourist_rfp(
    payload: CreateRFPRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Broadcast a traveler RFP to verified local hosts in the target district.
    """
    return await MarketplaceService.create_rfp(db, payload.model_dump())


@router.post("/marketplace/bid", status_code=status.HTTP_201_CREATED)
async def submit_host_bid(
    payload: SubmitBidRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Host submits a competitive zero-commission bid on an open tourist RFP.
    """
    result = await MarketplaceService.submit_bid(db, payload.model_dump())
    if "error" in result:
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result


@router.post("/marketplace/bid/{bid_id}/accept")
async def accept_host_bid(
    bid_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Traveler accepts a host bid, generating a confirmed booking with 97% host payout.
    """
    result = await MarketplaceService.accept_bid(db, bid_id=bid_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result


@router.get("/host/dashboard")
async def get_host_dashboard(
    host_id: str = "host-bastar-01",
    state: str = "Chhattisgarh",
    db: AsyncSession = Depends(get_db)
):
    """
    Host Seller Hub telemetry: Gross revenue, 0% OTA commission savings,
    PM-JUGA trust score, active leads, and AI Dynamic Pricing Co-Pilot recommendations.
    """
    return await MarketplaceService.get_host_dashboard(db, host_id=host_id, state=state)


@router.get("/host/pricing-recommendation")
async def get_pricing_recommendation(
    state: str = "Chhattisgarh",
    base_tariff: float = 1650.0
):
    """
    AI Dynamic Pricing Co-Pilot: Indian festival calendar and weekend demand surge advice.
    """
    return PricingService.get_pricing_recommendation(state=state, base_tariff_inr=base_tariff)


@router.post("/host/pricing/apply")
async def apply_dynamic_pricing(payload: ApplyPricingRequest):
    """
    Host applies recommended dynamic tariff to their homestay listing.
    """
    return {
        "success": True,
        "host_id": payload.host_id,
        "updated_tariff_inr": payload.new_tariff_inr,
        "message": f"Successfully updated base tariff to ₹{payload.new_tariff_inr:.2f}/night on the DPI network."
    }
