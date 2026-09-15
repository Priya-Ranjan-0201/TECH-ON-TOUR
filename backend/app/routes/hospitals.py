"""
backend/app/routes/hospitals.py
-------------------------------
Re-export hospital router and handlers from app.api.hospitals for standard route import conventions.
"""

from app.api.hospitals import (
    router,
    LocationRequest,
    haversine,
    build_overpass_query,
    query_overpass,
    get_nearby_hospitals,
    get_current_hourly_token,
    OVERPASS_ENDPOINTS,
    OVERPASS_HEADERS,
    _HOSPITAL_CACHE,
)

__all__ = [
    "router",
    "LocationRequest",
    "haversine",
    "build_overpass_query",
    "query_overpass",
    "get_nearby_hospitals",
    "get_current_hourly_token",
    "OVERPASS_ENDPOINTS",
    "OVERPASS_HEADERS",
    "_HOSPITAL_CACHE",
]
