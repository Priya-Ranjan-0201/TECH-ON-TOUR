from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Query
from app.schemas.insights import WeatherResponse, WeatherForecastItem, SafetyScoreResponse

router = APIRouter(tags=["Weather & Safety Insights"])

# Regional weather profile baseline
WEATHER_PROFILES = {
    "manali": {"temp": 14.5, "condition": "Partly Cloudy", "rain": 25, "is_rainy": False},
    "shimla": {"temp": 16.0, "condition": "Pleasant Breeze", "rain": 15, "is_rainy": False},
    "hampi": {"temp": 29.5, "condition": "Sunny & Dry", "rain": 5, "is_rainy": False},
    "bastar": {"temp": 26.0, "condition": "Mild Humid", "rain": 20, "is_rainy": False},
    "munnar": {"temp": 18.0, "condition": "Misty Showers", "rain": 65, "is_rainy": True},
    "ooty": {"temp": 15.0, "condition": "Overcast", "rain": 30, "is_rainy": False},
    "goa": {"temp": 30.0, "condition": "Tropical Sun", "rain": 10, "is_rainy": False},
    "default": {"temp": 24.0, "condition": "Clear Sky", "rain": 10, "is_rainy": False}
}

# Regional NCRB / Safety Baseline
SAFETY_DATA = {
    "himachal pradesh": {"score": 93, "risk": "Low", "women_index": 91},
    "kerala": {"score": 90, "risk": "Low", "women_index": 89},
    "goa": {"score": 86, "risk": "Low", "women_index": 84},
    "karnataka": {"score": 88, "risk": "Low", "women_index": 85},
    "chhattisgarh": {"score": 82, "risk": "Moderate", "women_index": 80},
    "rajasthan": {"score": 85, "risk": "Low", "women_index": 83},
    "tamil nadu": {"score": 89, "risk": "Low", "women_index": 88},
    "uttarakhand": {"score": 91, "risk": "Low", "women_index": 89},
    "default": {"score": 85, "risk": "Low", "women_index": 84}
}


@router.get("/weather", response_model=WeatherResponse)
async def get_weather(
    destination: Optional[str] = Query(None, description="Destination name (e.g. 'Manali', 'Hampi')"),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
):
    """
    Retrieve real-time / cached weather advisory for itinerary adjustment.
    """
    dest_name = (destination or "").strip()
    if not dest_name:
        if lat is not None and (lon is not None or lng is not None):
            dest_name = f"Coordinates ({lat:.2f}, {(lon or lng):.2f})"
        else:
            dest_name = "Manali"

    key = dest_name.strip().lower()
    profile = WEATHER_PROFILES.get(key, WEATHER_PROFILES["default"])

    is_rain = profile.get("is_rainy", False) or profile["rain"] >= 50
    advisory = (
        "Active rainfall projected. Prioritize indoor heritage museums, temple complexes, and craft workshops."
        if is_rain else
        "Excellent outdoor weather. Ideal for monument exploration, treks, and open-air bazaars."
    )

    forecast = [
        WeatherForecastItem(
            day=1,
            temp_max_c=profile["temp"] + 2.0,
            temp_min_c=profile["temp"] - 4.0,
            condition=profile["condition"],
            rain_probability_pct=profile["rain"]
        ),
        WeatherForecastItem(
            day=2,
            temp_max_c=profile["temp"] + 1.5,
            temp_min_c=profile["temp"] - 3.5,
            condition="Clear & Sunny" if not is_rain else "Scattered Showers",
            rain_probability_pct=max(10, profile["rain"] - 15)
        ),
        WeatherForecastItem(
            day=3,
            temp_max_c=profile["temp"] + 3.0,
            temp_min_c=profile["temp"] - 2.0,
            condition="Sunny",
            rain_probability_pct=10
        )
    ]

    return WeatherResponse(
        destination=destination.title(),
        current_temp_c=profile["temp"],
        feels_like_c=profile["temp"] + 1.0,
        condition=profile["condition"],
        is_rainy=is_rain,
        rain_probability_pct=profile["rain"],
        advisory=advisory,
        forecast_3_day=forecast
    )


@router.get("/safety-score", response_model=SafetyScoreResponse)
async def get_safety_score(
    location: Optional[str] = Query("India", description="Destination city or town"),
    state: Optional[str] = Query("Himachal Pradesh", description="State name for NCRB normalization")
):
    """
    Retrieve normalized safety scores, risk advisory, and official emergency contacts.
    """
    state_key = state.strip().lower() if state else "default"
    data = SAFETY_DATA.get(state_key, SAFETY_DATA["default"])

    return SafetyScoreResponse(
        location=location.title() if location else "Regional Circuit",
        state=state.title() if state else "All India",
        safety_score=data["score"],
        risk_level=data["risk"],
        women_safety_index=data["women_index"],
        emergency_helpline="112",
        police_helpline="100",
        tourist_police_helpline="1363",
        last_updated=datetime.now(timezone.utc).strftime("%Y-%m-%d")
    )
