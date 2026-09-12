from typing import List, Optional, Union
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    author_name: str
    rating: float
    review_text: str
    sentiment_score: float
    authenticity_score: int
    is_verified_booking: bool


class DestinationBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    state: str
    category: str
    latitude: float
    longitude: float
    price_range: str
    rating: float
    review_count: int
    description: str
    best_season: str
    image_url: str
    is_famous: bool = False
    is_hidden_gem: bool = False
    crowd_density_score: int = 50
    safety_score: int = 85

    # Enriched fields
    summary: Optional[str] = None
    image_source: Optional[str] = "placeholder"
    needs_manual_photo: bool = False
    photo_verified_at: Optional[Union[datetime, str]] = None
    district: Optional[str] = None
    activities: Optional[List[str]] = None
    bestSeason: Optional[str] = None
    image: Optional[str] = None
    images: Optional[List[str]] = None
    budget: Optional[dict] = None
    average_budget: Optional[float] = None
    recommended_days: Optional[int] = None
    recommendedDays: Optional[int] = None


class DestinationListResponse(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
    results: List[DestinationBase]
    hourly_token: Optional[str] = None
    message: Optional[str] = None


class DestinationDetailResponse(BaseModel):
    success: bool = True
    destination: DestinationBase
    verified_reviews: List[ReviewResponse] = []


class SearchDestinationItem(BaseModel):
    id: int
    name: str
    state: str
    category: str
    image: str
    image_url: str
    rating: float
    price_range: str = "mid"
    description: str = ""


class DestinationSearchResponse(BaseModel):
    success: bool = True
    query: str
    results: List[SearchDestinationItem]
    count: int
    hourly_token: Optional[str] = None


class NearbyDestinationItem(DestinationBase):
    distance_km: float


class NearbyQueryResponse(BaseModel):
    center: dict
    radius_km: float
    count: int
    places: List[NearbyDestinationItem]


class StateCountItem(BaseModel):
    state: str
    destination_count: int


class StatesListResponse(BaseModel):
    total_states: int
    states: List[StateCountItem]
