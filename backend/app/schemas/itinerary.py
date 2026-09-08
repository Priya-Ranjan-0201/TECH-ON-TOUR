from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ItineraryRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    destination: Optional[str] = Field(default=None, description="City, region, or attraction name")
    state: Optional[str] = Field(default=None, description="Indian State or Union Territory")
    days: int = Field(default=3, ge=1, le=7, description="Number of days (1 to 7)")
    budget: str = Field(default="moderate", pattern="^(budget|moderate|luxury)$", description="Budget tier")
    interests: List[str] = Field(
        default_factory=lambda: ["Heritage & Monuments", "Nature & Wildlife"],
        description="Selected interest tags"
    )
    pace: str = Field(default="moderate", pattern="^(relaxed|moderate|active)$", description="Pace of travel")
    group_type: str = Field(default="solo", description="Solo, Couple, Family, Friends")
    mobility: str = Field(default="moderate", description="Easy, Moderate, Active")


class ItineraryStop(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    time_slot: str  # "Morning (09:00 - 12:30)", "Afternoon (13:30 - 17:00)", "Evening (17:30 - 20:30)"
    title: str
    destination_id: Optional[int] = None
    destination_name: str
    category: str
    latitude: float
    longitude: float
    estimated_duration: str
    estimated_cost_inr: int
    description: str
    insider_tip: str
    image_url: Optional[str] = None
    # Enhanced TransitGuard & Real-World Context Fields
    transit_from_previous_km: Optional[float] = Field(default=None, description="Haversine distance from preceding stop")
    transit_time_minutes: Optional[int] = Field(default=None, description="Estimated transit duration in local traffic")
    transit_guard_fare_inr: Optional[int] = Field(default=None, description="Fair municipal transit fare cap (anti-tourist tax)")
    transit_mode: Optional[str] = Field(default="E-Rickshaw / Auto", description="Recommended eco/local commute mode")
    crowd_level: Optional[str] = Field(default="Moderate", description="Predicted footfall level")
    best_time_to_visit: Optional[str] = Field(default=None, description="Optimal arrival window for lighting & quiet exploration")


class ItineraryDay(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    day_number: int
    theme: str
    weather_advisory: Optional[str] = None
    stops: List[ItineraryStop]
    day_cost_inr: int
    # Enhanced Regional Culture & Lodging
    culinary_highlight: Optional[str] = Field(default=None, description="Authentic regional GI delicacy recommendation")
    recommended_homestay: Optional[Dict[str, Any]] = Field(default=None, description="Matched PM-JUGA tribal or heritage homestay")


class BudgetBreakdown(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    accommodation_inr: int
    activities_inr: int
    food_inr: int
    transit_inr: int
    total_inr: int
    ota_commission_saved_inr: int


class EcoFootprint(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    carbon_kg: float = Field(description="Estimated travel carbon emissions in kg CO2e")
    commercial_tour_carbon_kg: float = Field(description="Typical commercial tour carbon footprint in kg CO2e")
    carbon_saved_pct: int = Field(description="Percentage emissions reduced via TravelSathi eco-stays & local transit")
    eco_tokens_awarded: int = Field(description="Gamified eco-tokens earned, redeemable on GI handicrafts")


class ItineraryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    destination: str
    state: str
    days: int
    budget: str
    interests: List[str]
    summary: str
    days_schedule: List[ItineraryDay]
    budget_breakdown: BudgetBreakdown
    eco_footprint: Optional[EcoFootprint] = None
    generation_source: str  # "gemini-1.5-flash" or "deterministic-graph-solver"
    created_at: datetime


class AlternativeStop(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    destination_id: int
    name: str
    category: str
    rating: float
    latitude: float
    longitude: float
    description: str
    image_url: Optional[str] = None
    state: Optional[str] = None
    is_hidden_gem: Optional[bool] = False


class SwapStopRequest(BaseModel):
    day_number: int = Field(ge=1, le=7)
    stop_index: int = Field(ge=0, le=10)
    new_destination_id: int


class ReorderStopsRequest(BaseModel):
    day_number: int = Field(ge=1, le=7)
    new_order: List[int] = Field(description="List of original 0-indexed stop positions in new order")


class ConvertToRFPRequest(BaseModel):
    target_budget_inr: Optional[int] = None
    traveler_notes: Optional[str] = None
    contact_phone: Optional[str] = None

