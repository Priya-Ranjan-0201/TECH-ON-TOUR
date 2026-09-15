import math
import re
from datetime import datetime, date
from pathlib import Path
from typing import List, Dict, Any, Optional
import pandas as pd
import joblib

ML_MODEL_PATH = Path(__file__).resolve().parent.parent / "ml" / "event_relevance_model.joblib"
_ML_MODEL = None

def get_ml_model():
    global _ML_MODEL
    if _ML_MODEL is None and ML_MODEL_PATH.exists():
        try:
            _ML_MODEL = joblib.load(ML_MODEL_PATH)
        except Exception:
            _ML_MODEL = None
    return _ML_MODEL

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two points in kilometers."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def parse_date(d_str: Optional[str]) -> Optional[date]:
    if not d_str:
        return None
    try:
        return datetime.strptime(d_str[:10], "%Y-%m-%d").date()
    except Exception:
        return None

def evaluate_event_recommendation(
    user_destination: Optional[str],
    user_lat: Optional[float],
    user_lng: Optional[float],
    trip_start_date: Optional[str],
    trip_end_date: Optional[str],
    event: Dict[str, Any],
    user_interests: Optional[List[str]] = None,
    max_distance_km: float = 250.0
) -> Optional[Dict[str, Any]]:
    """
    Evaluates an event against user trip context using temporal and geospatial rules,
    refined with the trained Machine Learning Relevance Model.
    """
    u_start = parse_date(trip_start_date)
    u_end = parse_date(trip_end_date)
    
    # Event dates
    e_start = parse_date(event.get("event_start_date"))
    e_end = parse_date(event.get("event_end_date"))
    
    if not e_start or not e_end:
        e_start = e_end = None

    dest_name = (user_destination or "").strip().lower()
    event_city = (event.get("city") or "").strip().lower()
    event_state = (event.get("state") or "").strip().lower()

    # Exact tokenized city match to avoid substring false positives (e.g. "patna" in "visakhapatnam")
    dest_tokens = set(re.findall(r'[a-zA-Z]+', dest_name))
    city_tokens = set(re.findall(r'[a-zA-Z]+', event_city))
    slash_tokens = [c.strip().lower() for c in event_city.split('/')]

    is_same_city = bool(
        dest_name and (
            dest_name in slash_tokens or
            dest_name == event_city or
            (dest_tokens and dest_tokens.issubset(city_tokens))
        )
    )

    # Compute distance
    if user_lat is not None and user_lng is not None and event.get("latitude") and event.get("longitude"):
        dist_km = haversine_distance(user_lat, user_lng, float(event["latitude"]), float(event["longitude"]))
    elif is_same_city:
        dist_km = 8.0
    elif dest_name and dest_name in event_state:
        dist_km = 95.0
    else:
        dist_km = 850.0

    # Geospatial rule: If destination specified, strictly reject if > max_distance_km
    if user_destination and dist_km > max_distance_km:
        return None

    today = date(2026, 9, 15)  # Reference system date

    # Base status check
    if e_end and e_end < today:
        current_status = "ENDED"
    elif e_start and e_start <= today <= e_end:
        current_status = "ACTIVE"
    else:
        current_status = "UPCOMING"

    # Temporal logic
    match_type = "GENERAL_DISCOVERY"
    date_overlap_days = 0
    days_until_event = 0
    days_since_event = 0
    can_adjust_dates = False
    suggested_dates = None
    temporal_score = 1.0
    explanation = ""

    if u_start and u_end and e_start and e_end:
        # Case D: Event finished before trip
        if e_end < u_start:
            days_since_event = (u_start - e_end).days
            return None  # Do NOT recommend past events as upcoming trip matches

        # Case A / B: Overlap
        overlap_start = max(u_start, e_start)
        overlap_end = min(u_end, e_end)
        if overlap_start <= overlap_end:
            date_overlap_days = (overlap_end - overlap_start).days + 1
            if u_start >= e_start and u_end <= e_end:
                match_type = "PERFECT_MATCH"
                temporal_score = 5.0
                explanation = f"Happening during your entire planned stay in {event['city']}."
            else:
                match_type = "HAPPENING_DURING_TRIP"
                temporal_score = 4.5
                explanation = f"Happening during your trip ({date_overlap_days} day overlap)."
        
        # Case C: Event shortly after trip (1 - 21 days after user trip ends)
        elif e_start > u_end:
            gap = (e_start - u_end).days
            days_until_event = gap
            if gap <= 21:
                match_type = "COMING_SOON_AFTER"
                temporal_score = 3.8
                can_adjust_dates = True
                suggested_start = e_start.strftime("%Y-%m-%d")
                suggested_end = (e_start + (u_end - u_start)).strftime("%Y-%m-%d")
                suggested_dates = {
                    "start_date": suggested_start,
                    "end_date": suggested_end,
                    "gap_days": gap
                }
                explanation = (
                    f"Starts {gap} days after your planned trip. "
                    f"If your dates are flexible, consider shifting your trip to {e_start.strftime('%b %d')}–{e_end.strftime('%b %d')} "
                    f"to experience one of {event['city']}'s most celebrated cultural celebrations."
                )
            elif gap <= 45:
                match_type = "UPCOMING_SEASONAL"
                temporal_score = 2.4
                explanation = f"Occurs {gap} days after your planned dates."
            else:
                return None  # Outside relevance window

    elif u_start and e_start:
        gap = (e_start - u_start).days
        if 0 <= gap <= 30:
            temporal_score = 3.5
            match_type = "UPCOMING_NEAR_ARRIVAL"
            explanation = f"Starts within {gap} days of your planned arrival."

    # Distance score
    distance_score = 1.0
    if dist_km <= 25.0:
        distance_score = 1.5
    elif dist_km <= 100.0:
        distance_score = 1.2
    elif dist_km <= 200.0:
        distance_score = 0.9
    else:
        distance_score = 0.6

    # Tier boost
    tier = event.get("importance_tier", "TIER 2")
    tier_boost = 1.3 if tier == "TIER 1" else (1.1 if tier == "TIER 2" else 1.0)

    # Interest boost
    interest_boost = 1.0
    primary_interest = "Culture"
    if user_interests:
        cat = (event.get("event_category") or "").lower()
        tourist_int = (event.get("tourist_interests") or "").lower()
        for ui in user_interests:
            ui_clean = ui.strip().lower()
            if ui_clean in cat or ui_clean in tourist_int:
                interest_boost += 0.25
                primary_interest = ui.strip()

    rule_score = round(temporal_score * distance_score * tier_boost * interest_boost, 2)

    # ML Model Prediction Refinement
    ml_model = get_ml_model()
    if ml_model is not None:
        try:
            feat_df = pd.DataFrame([{
                "distance_km": float(dist_km),
                "importance_tier": "Tier 1 - National / International" if "1" in str(tier) else "Tier 2 - Regional",
                "event_category": event.get("event_category") or "Culture",
                "user_interest": primary_interest,
                "date_confidence": event.get("date_confidence") or "HIGH",
                "event_status": current_status.capitalize(),
                "date_overlap_days": int(date_overlap_days),
                "days_until_event": int(days_until_event),
                "days_since_event": int(days_since_event)
            }])
            ml_pred = float(ml_model.predict(feat_df)[0])
            # Blend 50% Rule Engine + 50% ML Model
            final_score = round(0.5 * rule_score + 0.5 * (ml_pred * 1.5), 2)
        except Exception:
            final_score = rule_score
    else:
        final_score = rule_score

    # Contextual explanation if not already set
    if not explanation:
        if is_same_city:
            explanation = f"Major {event.get('event_type')} taking place in {event['city']}."
        else:
            explanation = f"Major cultural fair located approximately {int(dist_km)} km from {user_destination}."

    return {
        "event_id": event["event_id"],
        "event_name": event["event_name"],
        "official_name": event.get("official_name"),
        "event_type": event.get("event_type"),
        "event_category": event.get("event_category"),
        "importance_tier": event.get("importance_tier"),
        "heritage_status": event.get("heritage_status"),
        "unesco_status": event.get("unesco_status"),
        "city": event.get("city"),
        "state": event.get("state"),
        "venue": event.get("venue"),
        "latitude": event.get("latitude"),
        "longitude": event.get("longitude"),
        "event_start_date": event.get("event_start_date"),
        "event_end_date": event.get("event_end_date"),
        "typical_month": event.get("typical_month"),
        "date_confidence": event.get("date_confidence"),
        "expected_footfall": event.get("expected_footfall"),
        "crowd_level": event.get("crowd_level"),
        "hero_image_url": event.get("hero_image_url"),
        "distance_km": round(dist_km, 1),
        "relevance_score": final_score,
        "match_type": match_type,
        "can_adjust_dates": can_adjust_dates,
        "suggested_dates": suggested_dates,
        "recommendation_reason": explanation,
        "status": current_status
    }
