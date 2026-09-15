import sqlite3
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

from app.services.event_recommendation_engine import evaluate_event_recommendation, haversine_distance

router = APIRouter(prefix="/api/events", tags=["Cultural Events & Melas"])

DB_PATH = Path(__file__).resolve().parent.parent.parent / "travelsathi_dev.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@router.get("")
def list_cultural_events(
    state: Optional[str] = None,
    city: Optional[str] = None,
    month: Optional[str] = None,
    category: Optional[str] = None,
    tier: Optional[str] = None,
    unesco_only: Optional[bool] = False,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM cultural_events WHERE 1=1"
    params = []

    if state:
        query += " AND LOWER(state) = LOWER(?)"
        params.append(state.strip())
    if city:
        query += " AND (LOWER(city) LIKE LOWER(?) OR LOWER(venue) LIKE LOWER(?))"
        params.append(f"%{city.strip()}%")
        params.append(f"%{city.strip()}%")
    if month:
        query += " AND LOWER(typical_month) = LOWER(?)"
        params.append(month.strip())
    if category:
        query += " AND LOWER(event_category) = LOWER(?)"
        params.append(category.strip())
    if tier:
        query += " AND LOWER(importance_tier) = LOWER(?)"
        params.append(tier.strip())
    if unesco_only:
        query += " AND (unesco_status IS NOT NULL AND unesco_status != 'Not Listed' AND unesco_status != '')"
    if search:
        query += " AND (LOWER(event_name) LIKE LOWER(?) OR LOWER(city) LIKE LOWER(?) OR LOWER(state) LIKE LOWER(?) OR LOWER(short_description) LIKE LOWER(?))"
        pattern = f"%{search.strip()}%"
        params.extend([pattern, pattern, pattern, pattern])

    query += " ORDER BY CASE importance_tier WHEN 'TIER 1' THEN 1 WHEN 'TIER 2' THEN 2 ELSE 3 END, event_start_date ASC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(query, params)
    rows = cursor.fetchall()

    # Total count
    count_query = "SELECT COUNT(*) FROM cultural_events WHERE 1=1"
    # Reuse filter without limit/offset
    # Simple count for pagination
    cursor.execute("SELECT COUNT(*) FROM cultural_events")
    total_count = cursor.fetchone()[0]

    events = [dict(r) for r in rows]
    conn.close()

    return {
        "total": total_count,
        "returned": len(events),
        "events": events
    }


@router.get("/recommend")
def recommend_cultural_events(
    destination: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    trip_start_date: Optional[str] = None,
    trip_end_date: Optional[str] = None,
    interests: Optional[str] = None
):
    """
    Temporal + Geospatial Cultural Festival Intelligence.
    Returns top 3 prioritized recommendations:
      1. Best Match
      2. Also Nearby
      3. Worth Considering
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # If coordinates not provided but destination is, resolve destination coordinates accurately
    if (latitude is None or longitude is None) and destination:
        dest_clean = destination.strip().lower()
        # 1. Check cultural events city/state directly
        cursor.execute(
            """
            SELECT latitude, longitude FROM cultural_events 
            WHERE LOWER(city) = ? OR LOWER(city) LIKE ? OR LOWER(state) = ?
            ORDER BY 
                CASE 
                    WHEN LOWER(city) = ? THEN 1
                    WHEN LOWER(city) LIKE ? THEN 2
                    WHEN LOWER(state) = ? THEN 3
                    ELSE 4
                END
            LIMIT 1
            """,
            (dest_clean, f"%{dest_clean}%", dest_clean, dest_clean, f"%{dest_clean}%", dest_clean)
        )
        dest_row = cursor.fetchone()

        # 2. Check destinations_master with exact name/state priority
        if not dest_row:
            cursor.execute(
                """
                SELECT latitude, longitude FROM destinations_master 
                WHERE LOWER(name) = ? OR LOWER(state) = ?
                   OR LOWER(name) LIKE ? OR LOWER(name) LIKE ?
                ORDER BY 
                    CASE 
                        WHEN LOWER(name) = ? THEN 1
                        WHEN LOWER(name) LIKE ? THEN 2
                        WHEN LOWER(name) LIKE ? THEN 3
                        WHEN LOWER(state) = ? THEN 4
                        ELSE 5
                    END
                LIMIT 1
                """,
                (dest_clean, dest_clean, f"{dest_clean}, %", f"%, {dest_clean}%",
                 dest_clean, f"{dest_clean}, %", f"%, {dest_clean}%", dest_clean)
            )
            dest_row = cursor.fetchone()

        if dest_row:
            latitude = float(dest_row["latitude"])
            longitude = float(dest_row["longitude"])

    cursor.execute("SELECT * FROM cultural_events")
    all_events = [dict(r) for r in cursor.fetchall()]
    conn.close()

    user_interests_list = [i.strip() for i in interests.split(",")] if interests else None

    evaluated = []
    for ev in all_events:
        rec = evaluate_event_recommendation(
            user_destination=destination,
            user_lat=latitude,
            user_lng=longitude,
            trip_start_date=trip_start_date,
            trip_end_date=trip_end_date,
            event=ev,
            user_interests=user_interests_list
        )
        if rec:
            evaluated.append(rec)

    # Sort strictly by relevance score descending
    evaluated.sort(key=lambda x: x["relevance_score"], reverse=True)

    # Max 3 recommendations for clean UX
    top_3 = evaluated[:3]
    labels = ["Best Match", "Also Nearby", "Worth Considering"]
    for i, item in enumerate(top_3):
        item["badge_label"] = labels[i] if i < len(labels) else "Recommended"

    return {
        "destination": destination,
        "trip_dates": {"start": trip_start_date, "end": trip_end_date},
        "total_relevant_found": len(evaluated),
        "recommendations": top_3
    }


@router.get("/{event_id}")
def get_event_details(event_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM cultural_events WHERE event_id = ?", (event_id,))
    ev_row = cursor.fetchone()
    if not ev_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Cultural event not found")

    event_data = dict(ev_row)

    # Fetch multi-year occurrences
    cursor.execute("SELECT * FROM event_occurrences WHERE event_id = ? ORDER BY year ASC", (event_id,))
    occurrences = [dict(r) for r in cursor.fetchall()]

    # Fetch verified sources
    cursor.execute("SELECT * FROM event_sources WHERE event_id = ?", (event_id,))
    sources = [dict(r) for r in cursor.fetchall()]

    # Fetch nearby verified accommodations and restaurants from tourism_businesses
    ev_lat = float(event_data.get("latitude") or 0.0)
    ev_lng = float(event_data.get("longitude") or 0.0)

    # Query businesses within same state or nearby lat/lng
    cursor.execute(
        """
        SELECT business_id, business_name, business_type, business_category, state, district,
               locality as city, latitude, longitude, rating, price_level, phone, address as full_address, image_url
        FROM tourism_businesses
        WHERE state = ? OR (latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?)
        LIMIT 100
        """,
        (event_data.get("state"), ev_lat - 0.5, ev_lat + 0.5, ev_lng - 0.5, ev_lng + 0.5)
    )
    biz_rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    # Calculate actual distance to festival venue
    nearby_accommodations = []
    nearby_restaurants = []

    for b in biz_rows:
        b_lat = float(b.get("latitude") or 0.0)
        b_lng = float(b.get("longitude") or 0.0)
        d_km = haversine_distance(ev_lat, ev_lng, b_lat, b_lng)
        b["distance_km"] = round(d_km, 1)

        b_type = (b.get("business_type") or "").lower()
        if b_type in ["hotel", "homestay", "guest_house", "rest_house", "dharamshala"]:
            nearby_accommodations.append(b)
        elif b_type in ["restaurant", "dhaba", "cafe"]:
            nearby_restaurants.append(b)

    nearby_accommodations.sort(key=lambda x: x["distance_km"])
    nearby_restaurants.sort(key=lambda x: x["distance_km"])

    event_data["occurrences"] = occurrences
    event_data["sources"] = sources
    event_data["nearby_stay_options"] = nearby_accommodations[:6]
    event_data["nearby_food_options"] = nearby_restaurants[:6]

    return event_data


@router.get("/{event_id}/itinerary")
def build_event_itinerary(event_id: str):
    """
    Builds a 3-4 day anchor itinerary specifically centered around the cultural festival.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cultural_events WHERE event_id = ?", (event_id,))
    ev = cursor.fetchone()
    conn.close()

    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    ev_dict = dict(ev)
    start_d = ev_dict.get("event_start_date") or "2026-10-17"

    return {
        "event_id": event_id,
        "event_name": ev_dict["event_name"],
        "city": ev_dict["city"],
        "state": ev_dict["state"],
        "anchor_dates": {"start": start_d, "end": ev_dict.get("event_end_date")},
        "itinerary_plan": [
            {
                "day": 1,
                "title": f"Arrival in {ev_dict['city']} & Cultural Orientation",
                "activities": [
                    f"Arrive via {ev_dict.get('nearest_airport', 'nearest transport hub')} or {ev_dict.get('nearest_railway_station', 'railway')}",
                    f"Check-in at festival-partnered local accommodation",
                    f"Evening walk through {ev_dict.get('locality', ev_dict['city'])} to observe festive preparations",
                    f"Taste authentic local delicacies: {ev_dict.get('local_food', 'Regional cuisine')}"
                ]
            },
            {
                "day": 2,
                "title": f"Peak Festival Experience — {ev_dict['event_name']}",
                "activities": [
                    f"Morning visit to venue: {ev_dict.get('venue', ev_dict['city'])}",
                    f"Witness headline rituals, parades, and cultural performances: {ev_dict.get('major_activities', 'Traditional celebrations')}",
                    f"Explore artisan stalls and craft showcases: {ev_dict.get('local_crafts', 'Local arts')}",
                    f"Evening grand spectacles and cultural illuminations"
                ]
            },
            {
                "day": 3,
                "title": f"Heritage Discovery & Nearby Exploration",
                "activities": [
                    f"Visit signature nearby heritage attractions: {ev_dict.get('nearby_attractions', 'City landmarks')}",
                    f"Deep dive into regional history: {ev_dict.get('historical_significance', 'Heritage roots')[:120]}...",
                    f"Community interaction and traditional souvenir shopping"
                ]
            },
            {
                "day": 4,
                "title": f"Farewell & Departure",
                "activities": [
                    f"Morning breakfast with signature regional flavors",
                    f"Check-out and transfer to {ev_dict.get('nearest_railway_station', 'station/airport')}"
                ]
            }
        ]
    }
