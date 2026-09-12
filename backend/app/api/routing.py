from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.services.routing_service import get_route

router = APIRouter(prefix="/routing", tags=["GIS & Routing"])

class RouteRequest(BaseModel):
    start_lat: float = Field(..., description="Starting latitude")
    start_lng: float = Field(..., description="Starting longitude")
    end_lat: float = Field(..., description="Ending latitude")
    end_lng: float = Field(..., description="Ending longitude")
    mode: Optional[str] = Field("driving-car", description="Routing mode: driving-car, foot-walking, cycling-regular")

@router.post("/directions")
async def calculate_route(payload: RouteRequest) -> Dict[str, Any]:
    """
    Compute turn-by-turn road route via OpenRouteService or precision Haversine fallback.
    Returns distance in km, duration in minutes, polyline coordinates, and Google Maps deep-link navigation URL.
    """
    res = await get_route(
        start_lat=payload.start_lat,
        start_lng=payload.start_lng,
        end_lat=payload.end_lat,
        end_lng=payload.end_lng,
        mode=payload.mode or "driving-car"
    )
    return res

@router.get("")
@router.get("/route")
@router.get("/directions")
async def calculate_route_get(
    start_lat: float = Query(..., description="Start latitude"),
    start_lng: float = Query(..., description="Start longitude"),
    end_lat: float = Query(..., description="End latitude"),
    end_lng: float = Query(..., description="End longitude"),
    mode: str = Query("driving-car", description="Mode")
) -> Dict[str, Any]:
    """
    GET convenience endpoint for calculating turn-by-turn road routes.
    Available at /api/routing, /api/routing/route, and /api/routing/directions.
    """
    res = await get_route(
        start_lat=start_lat,
        start_lng=start_lng,
        end_lat=end_lat,
        end_lng=end_lng,
        mode=mode
    )
    return res

