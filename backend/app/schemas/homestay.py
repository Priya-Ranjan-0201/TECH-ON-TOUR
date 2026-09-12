from typing import List
from pydantic import BaseModel, ConfigDict


class HomestayBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    homestay_id: str
    host_name: str
    host_phone: str
    title: str
    description: str
    state: str
    district: str
    base_price_inr: float
    is_tribal_pmjuga: bool
    sanitation_trust_score: int
    is_verified: bool
    latitude: float
    longitude: float
    amenities: str
    image_url: str


class HomestayListResponse(BaseModel):
    total: int
    results: List[HomestayBase]
