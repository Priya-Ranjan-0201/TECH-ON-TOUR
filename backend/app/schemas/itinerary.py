from datetime import datetime
from typing import List, Optional
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


class ItineraryDay(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    day_number: int
    theme: str
    weather_advisory: Optional[str] = None
    stops: List[ItineraryStop]
    day_cost_inr: int


class BudgetBreakdown(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    accommodation_inr: int
    activities_inr: int
    food_inr: int
    transit_inr: int
    total_inr: int
    ota_commission_saved_inr: int


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
    generation_source: str  # "gemini-1.5-flash" or "deterministic-graph-solver"
    created_at: datetime
