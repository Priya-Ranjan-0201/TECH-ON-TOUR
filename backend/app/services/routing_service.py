import os
import math
import logging
from typing import Dict, Any, List, Optional
import httpx
from app.services.gis_service import calculate_haversine_distance

logger = logging.getLogger("routing_service")

ORS_API_KEY = os.getenv("ORS_API_KEY")

def decode_polyline(encoded: str) -> List[List[float]]:
    """
    Decodes an encoded polyline string into a list of [lat, lng] coordinates.
    Standard Google Polyline algorithm used by OpenRouteService and OSRM.
    """
    if not encoded or not isinstance(encoded, str):
        return []
    
    coordinates = []
    index = 0
    lat = 0
    lng = 0
    length = len(encoded)

    while index < length:
        # Decode latitude
        shift = 0
        result = 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        dlat = ~(result >> 1) if (result & 1) else (result >> 1)
        lat += dlat

        # Decode longitude
        shift = 0
        result = 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        dlng = ~(result >> 1) if (result & 1) else (result >> 1)
        lng += dlng

        coordinates.append([lat / 1e5, lng / 1e5])

    return coordinates


async def get_route(
    start_lat: float, 
    start_lng: float, 
    end_lat: float, 
    end_lng: float, 
    mode: str = "driving-car"
) -> Dict[str, Any]:
    """
    Fetch turn-by-turn road route between two coordinates via OpenRouteService.
    Falls back gracefully to high-precision Haversine distance if ORS is unreachable or key is unset.
    Always returns valid coordinates for Leaflet Polyline rendering.
    """
    # Defensive coordinate check
    if not (start_lat and start_lng and end_lat and end_lng):
        return {
            "distance_km": 0.0,
            "duration_min": 0.0,
            "coordinates": [],
            "is_estimated": True,
            "error": "Invalid coordinates provided"
        }

    # Haversine baseline calculation
    direct_dist_km = round(calculate_haversine_distance(start_lat, start_lng, end_lat, end_lng), 2)
    # Average speed estimation in Indian transit conditions: 38 km/h
    est_duration_min = round((direct_dist_km / 38.0) * 60.0, 1)

    # Attempt OpenRouteService if key is configured
    if ORS_API_KEY:
        url = f"https://api.openrouteservice.org/v2/directions/{mode}"
        headers = {
            "Authorization": ORS_API_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json, application/geo+json"
        }
        body = {
            "coordinates": [[float(start_lng), float(start_lat)], [float(end_lng), float(end_lat)]]
        }
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                r = await client.post(url, json=body, headers=headers)
                if r.status_code == 200:
                    data = r.json()
                    route = data["routes"][0]
                    summary = route.get("summary", {})
                    distance_km = round(summary.get("distance", direct_dist_km * 1000) / 1000.0, 2)
                    duration_min = round(summary.get("duration", est_duration_min * 60) / 60.0, 1)
                    
                    raw_geom = route.get("geometry")
                    if isinstance(raw_geom, str):
                        coords = decode_polyline(raw_geom)
                    elif isinstance(raw_geom, list):
                        coords = [[pt[1], pt[0]] for pt in raw_geom]
                    else:
                        coords = [[start_lat, start_lng], [end_lat, end_lng]]

                    return {
                        "distance_km": distance_km,
                        "duration_min": duration_min,
                        "coordinates": coords,
                        "geometry": raw_geom if raw_geom else {"type": "LineString", "coordinates": [[pt[1], pt[0]] for pt in coords]},
                        "is_estimated": False,
                        "provider": "openrouteservice",
                        "google_maps_nav_url": f"https://www.google.com/maps/dir/?api=1&destination={end_lat},{end_lng}&travelmode=driving"
                    }
                else:
                    logger.warning(f"ORS returned HTTP {r.status_code}: {r.text[:100]}")
        except Exception as e:
            logger.warning(f"ORS routing query failed: {e}. Trying OpenStreetMap OSRM.")

    # High-fidelity OpenStreetMap (OSRM) Road Routing (No API Key Required)
    try:
        osrm_profile = "driving" if "car" in mode else ("walking" if "walk" in mode else "cycling")
        osrm_url = f"https://router.project-osrm.org/route/v1/{osrm_profile}/{start_lng},{start_lat};{end_lng},{end_lat}?overview=full&geometries=geojson"
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(osrm_url)
            if resp.status_code == 200:
                osrm_data = resp.json()
                if osrm_data.get("routes") and len(osrm_data["routes"]) > 0:
                    r_best = osrm_data["routes"][0]
                    dist_km = round(r_best.get("distance", direct_dist_km * 1000) / 1000.0, 2)
                    dur_min = round(r_best.get("duration", est_duration_min * 60) / 60.0, 1)
                    raw_pts = r_best.get("geometry", {}).get("coordinates", [])
                    # OSRM returns [lng, lat] GeoJSON; Leaflet requires [lat, lng]
                    leaflet_coords = [[pt[1], pt[0]] for pt in raw_pts] if raw_pts else [[start_lat, start_lng], [end_lat, end_lng]]
                    return {
                        "distance_km": dist_km,
                        "duration_min": dur_min,
                        "coordinates": leaflet_coords,
                        "geometry": r_best.get("geometry") or {"type": "LineString", "coordinates": raw_pts},
                        "is_estimated": False,
                        "provider": "openstreetmap_osrm",
                        "google_maps_nav_url": f"https://www.google.com/maps/dir/?api=1&destination={end_lat},{end_lng}&travelmode=driving"
                    }
    except Exception as osrm_err:
        logger.warning(f"OSRM road routing fallback failed: {osrm_err}. Using geodesic Haversine.")

    # High-precision fallback with generated intermediate points along geodesic
    # Create smooth path with intermediate curvature
    num_pts = 6
    interpolated_coords = []
    for i in range(num_pts + 1):
        frac = i / float(num_pts)
        lat_i = start_lat + (end_lat - start_lat) * frac
        lng_i = start_lng + (end_lng - start_lng) * frac
        # slight natural road curve
        arc = math.sin(frac * math.pi) * 0.002
        interpolated_coords.append([round(lat_i + arc, 5), round(lng_i - arc, 5)])

    return {
        "distance_km": direct_dist_km,
        "duration_min": est_duration_min,
        "coordinates": interpolated_coords,
        "geometry": {"type": "LineString", "coordinates": [[pt[1], pt[0]] for pt in interpolated_coords]},
        "is_estimated": True,
        "provider": "haversine_fallback",
        "google_maps_nav_url": f"https://www.google.com/maps/dir/?api=1&destination={end_lat},{end_lng}&travelmode=driving"
    }

