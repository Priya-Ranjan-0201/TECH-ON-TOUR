import math
import time
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

import httpx
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.core.rate_limit import rate_limit_hospitals

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Hospitals & Emergency"])


def get_current_hourly_token() -> str:
    """Generate or retrieve current active hourly token."""
    return f"tok_hourly_{datetime.now(timezone.utc).strftime('%Y%m%d_%H00')}"


class LocationRequest(BaseModel):
    latitude: float = Field(..., description="User latitude (WGS-84)")
    longitude: float = Field(..., description="User longitude (WGS-84)")
    amenities: Optional[List[str]] = Field(
        default=None,
        description="Optional list of amenities to query, e.g. ['hospital', 'clinic'] or ['hospital', 'hotel', 'restaurant']"
    )
    radius_m: Optional[int] = Field(
        default=10000,
        description="Search radius in meters (default 10,000m / 10km)"
    )


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate geodesic distance in kilometers between two GPS coordinates."""
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 2)


OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]

OVERPASS_HEADERS = {
    "User-Agent": "HospitalFinder/2.0 (emergency healthcare locator; health@portal.org)",
    "Content-Type": "application/x-www-form-urlencoded",
    "Accept": "application/json",
}

# In-memory response cache: key -> {"data": dict, "timestamp": float}
_HOSPITAL_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 3600  # 1 hour


def build_overpass_query(
    lat: float,
    lon: float,
    radius_m: int = 10000,
    amenities: Optional[List[str]] = None,
) -> str:
    """
    Build Overpass QL query for OSM amenities around GPS coordinates.
    Defaults to hospital and clinic, but can be extended for Essentials toggle (hospital, hotel, restaurant).
    """
    amenity_list = [a.strip().lower() for a in amenities] if amenities else ["hospital", "clinic"]
    query_blocks = []
    for am in amenity_list:
        query_blocks.append(f'  node["amenity"="{am}"](around:{radius_m},{lat},{lon});')
        query_blocks.append(f'  way["amenity"="{am}"](around:{radius_m},{lat},{lon});')
    
    body = "\n".join(query_blocks)
    return f"""[out:json][timeout:25];
(
{body}
);
out center;
"""


async def query_overpass(query: str) -> dict:
    """
    Query Overpass API mirrors with failover and timeouts.
    """
    async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
        for endpoint in OVERPASS_ENDPOINTS:
            try:
                resp = await client.post(
                    endpoint,
                    data={"data": query},
                    headers=OVERPASS_HEADERS
                )
                if resp.status_code == 200:
                    return resp.json()
            except Exception as e:
                logger.warning(f"Overpass mirror {endpoint} failed: {e}")
                continue
    raise RuntimeError("All OpenStreetMap Overpass mirrors failed or timed out.")


@router.post(
    "/nearby-hospitals",
    dependencies=[Depends(rate_limit_hospitals)],
    summary="Locate Nearest Hospitals & Clinics within 10km"
)
async def get_nearby_hospitals(location: LocationRequest):
    """
    Find nearest hospitals and clinics within radius (default 10km) of real-time GPS coordinates.
    Zero-auth required. Rate-limited to 20 req/hour/IP.
    Responses cached per rounded coordinates (2 decimals) for 1 hour.
    """
    lat = location.latitude
    lon = location.longitude
    radius_m = location.radius_m or 10000
    amenities = location.amenities or ["hospital", "clinic"]

    # 1. Hourly Token & Cache Key (rounded to 2 decimals)
    hourly_token = get_current_hourly_token()
    lat_round = round(lat, 2)
    lon_round = round(lon, 2)
    amenity_key = "_".join(sorted(amenities))
    cache_key = f"{lat_round:.2f}_{lon_round:.2f}_{radius_m}_{amenity_key}_{hourly_token}"

    now = time.time()
    if cache_key in _HOSPITAL_CACHE:
        cache_entry = _HOSPITAL_CACHE[cache_key]
        if now - cache_entry["timestamp"] < CACHE_TTL_SECONDS:
            cached_data = dict(cache_entry["data"])
            cached_data["cached"] = True
            cached_data["hourly_token"] = hourly_token
            return cached_data

    # 2. Build Overpass Query
    query = build_overpass_query(lat, lon, radius_m=radius_m, amenities=amenities)

    # 3. Query OSM Overpass mirrors with graceful JSON error handling
    try:
        data = await query_overpass(query)
    except RuntimeError as e:
        logger.error(f"Overpass mirrors failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "error": "Overpass service temporarily unavailable",
                "detail": str(e),
                "hospitals": [],
                "total": 0,
                "hourly_token": hourly_token,
                "cached": False,
            }
        )
    except Exception as e:
        logger.error(f"Hospital search failed: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Hospital search failed",
                "detail": str(e),
                "hospitals": [],
                "total": 0,
                "hourly_token": hourly_token,
                "cached": False,
            }
        )

    # 4. Parse elements, deduplicate by name, calculate Haversine distance
    hospitals = []
    seen_names: set[str] = set()

    for el in data.get("elements", []):
        tags = el.get("tags", {})
        name = tags.get("name", "").strip()
        if not name or name in seen_names:
            continue
        seen_names.add(name)

        el_lat = el.get("lat") or (el.get("center") or {}).get("lat")
        el_lon = el.get("lon") or (el.get("center") or {}).get("lon")
        if not el_lat or not el_lon:
            continue

        distance = haversine(lat, lon, el_lat, el_lon)
        maps_url = (
            f"https://www.google.com/maps/dir/?api=1"
            f"&destination={el_lat},{el_lon}"
            f"&destination_place_id={name.replace(' ', '+')}"
        )

        hospitals.append({
            "id": el.get("id"),
            "name": name,
            "type": tags.get("amenity", "hospital").capitalize(),
            "address": ", ".join(
                filter(None, [
                    tags.get("addr:street"),
                    tags.get("addr:housenumber"),
                    tags.get("addr:city"),
                ])
            ) or None,
            "phone": tags.get("phone") or tags.get("contact:phone") or tags.get("telephone"),
            "website": tags.get("website") or tags.get("contact:website"),
            "emergency": tags.get("emergency"),
            "opening_hours": tags.get("opening_hours"),
            "latitude": el_lat,
            "longitude": el_lon,
            "distance_km": distance,
            "maps_url": maps_url,
        })

    # 5. Sort by proximity
    hospitals.sort(key=lambda x: x["distance_km"])

    response_payload = {
        "hospitals": hospitals[:15],
        "total": len(hospitals),
        "hourly_token": hourly_token,
        "cached": False,
    }

    # 6. Save in cache
    _HOSPITAL_CACHE[cache_key] = {
        "data": response_payload,
        "timestamp": now,
    }

    return response_payload
