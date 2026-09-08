from typing import List, Optional
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
    is_hidden_gem: bool = False
    crowd_density_score: int = 50
    safety_score: int = 85


class DestinationListResponse(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
    results: List[DestinationBase]


class DestinationDetailResponse(BaseModel):
    destination: DestinationBase
    verified_reviews: List[ReviewResponse] = []


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
