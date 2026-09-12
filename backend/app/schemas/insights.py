from typing import List
from pydantic import BaseModel, ConfigDict


class AntiOvertourismItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    popular_name: str
    popular_state: str
    popular_footfall_annual: str
    alternative_name: str
    alternative_state: str
    crowd_reduction_pct: int
    reason: str


class AntiOvertourismListResponse(BaseModel):
    count: int
    circuits: List[AntiOvertourismItem]


class WeatherForecastItem(BaseModel):
    day: int
    temp_max_c: float
    temp_min_c: float
    condition: str
    rain_probability_pct: int


class WeatherResponse(BaseModel):
    destination: str
    current_temp_c: float
    feels_like_c: float
    condition: str
    is_rainy: bool
    rain_probability_pct: int
    advisory: str
    forecast_3_day: List[WeatherForecastItem]


class SafetyScoreResponse(BaseModel):
    location: str
    state: str
    safety_score: int  # 0 to 100
    risk_level: str    # Low, Moderate, Elevated
    women_safety_index: int
    emergency_helpline: str
    police_helpline: str
    tourist_police_helpline: str
    last_updated: str
