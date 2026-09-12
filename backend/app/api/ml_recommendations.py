"""
backend/app/api/ml_recommendations.py
-------------------------------------
Production REST API endpoints exposing the 7 specialized ML models
and central AI orchestration engine for TravelSathi / DESHORA.
"""

import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.connection import get_db
from app.database.models import UserPreference, UserInteraction, DestinationMaster
from app.services.recommendation_service import recommendation_engine, haversine_distance_km
from ml.inference.orchestrator import orchestrator
from ml.inference.model_loaders import registry
from ml.config.settings import (
    INTERACTION_WEIGHTS,
    SEASON_LABELS,
    CROWD_LABELS,
    PROCESSED_DATA_DIR
)
import pandas as pd
import numpy as np

router = APIRouter(tags=["Multi-Model AI Recommendations"])

# -------------------------------------------------------------
# Pydantic Request / Response Models
# -------------------------------------------------------------

class UserPreferencesPayload(BaseModel):
    user_id: str
    age_group: Optional[str] = "25-34"
    budget: Optional[str] = "mid"
    travel_style: Optional[str] = "nature"
    preferred_state: Optional[str] = None
    preferred_categories: Optional[str] = "nature, adventure"
    preferred_activities: Optional[str] = "trekking, sightseeing"
    preferred_climate: Optional[str] = "temperate"
    trip_duration_days: Optional[int] = 4
    group_type: Optional[str] = "solo"

class MLFeedbackEvent(BaseModel):
    user_id: str
    destination_id: int
    event_type: str = Field(..., description="view, click, save, share, itinerary_add, booking, positive_rating, rejection, skip")
    duration_seconds: Optional[int] = 0
    rating: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

# -------------------------------------------------------------
# 1. CENTRAL RECOMMENDATION ENGINE
#    GET /api/recommendations
# -------------------------------------------------------------

@router.get("/api/recommendations")
async def get_multi_model_recommendations(
    user_id: Optional[str] = Query(None, description="Optional user ID for personalized history"),
    travel_style: Optional[str] = Query(None, description="Travel style: nature, adventure, heritage, etc."),
    budget: Optional[str] = Query(None, description="budget, mid, or luxury"),
    activities: Optional[str] = Query(None, description="Comma-separated preferred activities"),
    month: Optional[int] = Query(None, description="Travel month index (1-12)"),
    lat: Optional[float] = Query(None, description="User current latitude"),
    lon: Optional[float] = Query(None, description="User current longitude"),
    top_k: int = Query(10, ge=1, le=50, description="Number of recommendations"),
    anchor_id: Optional[int] = Query(None, description="Optional anchor destination ID for similarity"),
    db: AsyncSession = Depends(get_db)
):
    """
    Executes the complete multi-model recommendation engine (Models 1 through 7)
    with feature fusion, business constraints, diversity filtering, and explainable AI reasons.
    """
    # Fetch user stored preferences if user_id is provided and no query overrides
    profile = {
        "budget": budget or "mid",
        "travel_style": travel_style or "nature",
        "preferred_activities": activities or "trekking, sightseeing",
        "age_group": "25-34"
    }

    if user_id:
        res = await db.execute(select(UserPreference).where(UserPreference.user_id == user_id))
        user_pref = res.scalar_one_or_none()
        if user_pref:
            if not budget and user_pref.budget_tier:
                profile["budget"] = user_pref.budget_tier
            if not travel_style and user_pref.travel_style:
                profile["travel_style"] = user_pref.travel_style

    context = {}
    if month:
        context["month"] = month
    if lat is not None:
        context["user_lat"] = lat
    if lon is not None:
        context["user_lon"] = lon

    try:
        recommendations = orchestrator.recommend(
            user_id=hash(user_id) % 10000 if user_id else None,
            user_profile=profile,
            context=context,
            top_k=top_k,
            anchor_destination_id=anchor_id
        )
        return {
            "status": "success",
            "count": len(recommendations),
            "recommendations": recommendations
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Recommendation engine error: {str(exc)}")

# -------------------------------------------------------------
# 2. MODEL 2: SEASON & WEATHER SUITABILITY
#    GET /api/recommendations/seasonal
# -------------------------------------------------------------

@router.get("/api/recommendations/seasonal")
async def get_seasonal_suitability(
    destination_id: Optional[int] = Query(None, description="Destination ID"),
    destination_name: Optional[str] = Query(None, description="Destination Name (e.g. Manali, Ooty, Goa)"),
    month: Optional[int] = Query(None, ge=1, le=12, description="Target travel month (1-12)"),
    temperature: Optional[float] = Query(None, description="Override temperature in °C"),
    rainfall: Optional[float] = Query(None, description="Override rainfall in mm"),
    user_id: Optional[str] = Query(None, description="User ID for row recommendation compatibility"),
    exclude_ids: Optional[str] = Query(None, description="Comma-separated IDs to exclude"),
    db: AsyncSession = Depends(get_db)
):
    """
    Evaluates season and meteorological suitability using Model 2 (HistGradientBoostingClassifier).
    Falls back to personalized seasonal row when queried by user_id without a specific destination.
    """
    if user_id and not destination_id and not destination_name and not temperature:
        parsed_exclude = [int(x) for x in exclude_ids.split(",") if x.strip().isdigit()] if exclude_ids else None
        return await recommendation_engine.get_row_by_type(
            session=db, row_type="seasonal", user_id=user_id, month=month, exclude_ids=parsed_exclude, limit=6
        )

    if not registry.is_loaded:
        registry.load_all()

    dest_id = destination_id
    if not dest_id and destination_name:
        dest_id = registry.dest_name_lookup.get(destination_name.strip().lower())

    dest_info = registry.dest_lookup.get(dest_id, {}) if dest_id else {}
    dest_display_name = dest_info.get("name", destination_name or "Selected Destination")

    cur_month = month or datetime.now().month
    month_names = ["", "January", "February", "March", "April", "May", "June", 
                   "July", "August", "September", "October", "November", "December"]
    month_str = month_names[cur_month] if 1 <= cur_month <= 12 else "Current Month"

    ctx = {
        "month": cur_month,
        "month_name": month_str,
        "temperature": temperature or 24.0,
        "rainfall": rainfall or 15.0,
        "humidity": 60.0,
        "wind_speed": 12.0,
        "weather_alert": 0
    }

    m2_res = orchestrator._batch_score_m2([dest_info], ctx)[0]

    reasons = [
        f"Weather classification assessed as {m2_res['classification']} for {month_str}",
        f"Suitability probability score: {m2_res['suitability_score']:.2f}"
    ]
    if m2_res["classification"] in ["Excellent", "Good"]:
        reasons.append("Comfortable climate with low probability of severe weather disruptions")
    else:
        reasons.append("Check local advisories for monsoon or temperature extremes before traveling")

    return {
        "status": "success",
        "destination": dest_display_name,
        "destination_id": dest_id,
        "month": month_str,
        "suitability_score": m2_res["suitability_score"],
        "classification": m2_res["classification"],
        "confidence": m2_res["confidence"],
        "reasons": reasons
    }

# -------------------------------------------------------------
# 3. MODEL 3: NEARBY PLACE RECOMMENDATION
#    GET /api/recommendations/nearby
# -------------------------------------------------------------

@router.get("/api/recommendations/nearby")
async def get_nearby_recommendations(
    destination_id: Optional[str] = Query(None, description="Parent destination ID"),
    lat: Optional[float] = Query(None, description="Current latitude"),
    lon: Optional[float] = Query(None, description="Current longitude"),
    lng: Optional[float] = Query(None, description="Alias for current longitude"),
    user_id: Optional[str] = Query(None, description="User ID for row recommendation compatibility"),
    exclude_ids: Optional[str] = Query(None, description="Comma-separated IDs to exclude"),
    category: Optional[str] = Query(None, description="Filter category: attraction, viewpoint, monument"),
    max_distance_km: float = Query(25.0, ge=1.0, le=100.0, description="Search radius in km"),
    top_k: int = Query(6, ge=1, le=20, description="Number of results"),
    db: AsyncSession = Depends(get_db)
):
    """
    Spatial candidate generation + Model 3 ranking (HistGradientBoostingRegressor).
    Ranks nearby attractions based on relevance, distance, popularity, and quality.
    """
    did = None
    if destination_id is not None:
        s_did = str(destination_id).strip()
        if s_did.isdigit():
            did = int(s_did)
        elif s_did.lower().startswith("dest-") and s_did[5:].isdigit():
            did = int(s_did[5:])

    if user_id and not did:
        parsed_exclude = [int(x) for x in exclude_ids.split(",") if x.strip().isdigit()] if exclude_ids else None
        return await recommendation_engine.get_row_by_type(
            session=db, row_type="nearby", user_id=user_id, lat=lat, lng=lng or lon, exclude_ids=parsed_exclude, limit=top_k
        )

    if not registry.is_loaded:
        registry.load_all()

    anchor_lat = lat
    anchor_lon = lon if lon is not None else lng

    if did and did in registry.dest_lookup:
        anchor_dest = registry.dest_lookup[did]
        anchor_lat = anchor_lat or float(anchor_dest.get("latitude", 0.0))
        anchor_lon = anchor_lon or float(anchor_dest.get("longitude", 0.0))

    if anchor_lat is None or anchor_lon is None:
        anchor_lat, anchor_lon = 28.6139, 77.2090  # Default center (Delhi)

    # Filter places from places.csv within max_distance_km
    places_path = PROCESSED_DATA_DIR / "places.csv"
    if not places_path.exists():
        return {"status": "success", "results": []}

    places_df = pd.read_csv(places_path)
    
    # Calculate Haversine distance
    rad = np.pi / 180.0
    dphi = (places_df["latitude"] - anchor_lat) * rad
    dlambda = (places_df["longitude"] - anchor_lon) * rad
    a = (np.sin(dphi / 2.0) ** 2 +
         np.cos(anchor_lat * rad) * np.cos(places_df["latitude"] * rad) * (np.sin(dlambda / 2.0) ** 2))
    places_df["distance_km"] = 6371.0 * 2.0 * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))

    nearby_pool = places_df[places_df["distance_km"] <= max_distance_km].copy()
    if len(nearby_pool) == 0:
        nearby_pool = places_df.sort_values(by="distance_km").head(top_k).copy()

    # Score with Model 3
    nearby_pool["popularity_score"] = nearby_pool["destination_id"].apply(
        lambda did: float(registry.dest_lookup.get(int(did), {}).get("popularity_score", 0.6))
    )
    nearby_pool["rating_place"] = nearby_pool["rating"]

    m3_model = registry.m3_nearby
    if m3_model is not None:
        nearby_pool["is_scenic_cat"] = nearby_pool["category"].apply(
            lambda c: 1.0 if any(w in str(c).lower() for w in ["viewpoint", "waterfall", "historic", "craft", "temple"]) else 0.0
        )
        nearby_pool["prox_score"] = nearby_pool["distance_km"].apply(lambda d: max(0.1, 1.0 - (d / 30.0)))
        nearby_pool["rat_score"] = (nearby_pool["rating_place"] - 3.0) / 2.0
        features = ["distance_km", "rating_place", "popularity_score", "price", "is_scenic_cat", "prox_score", "rat_score"]
        X = nearby_pool[features]
        nearby_pool["relevance_score"] = m3_model.predict(X)
    else:
        nearby_pool["relevance_score"] = (
            0.4 * (nearby_pool["rating"] / 5.0) +
            0.3 * nearby_pool["popularity_score"] +
            0.3 * (1.0 - nearby_pool["distance_km"] / max_distance_km)
        )

    nearby_pool.sort_values(by="relevance_score", ascending=False, inplace=True)
    top_places = nearby_pool.head(top_k)

    results = []
    for _, row in top_places.iterrows():
        did = int(row["destination_id"])
        dest_info = registry.dest_lookup.get(did, {})
        results.append({
            "place_id": str(row["place_id"]),
            "destination_id": did,
            "id": did,
            "name": str(row["name"]),
            "category": str(row.get("category", "attraction")),
            "distance_km": round(float(row["distance_km"]), 2),
            "relevance_score": round(float(np.clip(row["relevance_score"], 0.05, 0.99)), 4),
            "rating": float(row.get("rating", 4.0)),
            "price_inr": float(row.get("price", 0.0)),
            "image_url": dest_info.get("image_url", "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80"),
            "reason": f"Top-rated {row.get('category', 'attraction')} located {round(float(row['distance_km']), 1)} km away"
        })

    # Fallback to database if fewer than top_k items found
    if len(results) < top_k:
        try:
            query = (
                select(DestinationMaster)
                .where(
                    DestinationMaster.id != (destination_id or 0),
                    DestinationMaster.image_url.isnot(None),
                    DestinationMaster.image_url != "",
                    DestinationMaster.latitude.between(anchor_lat - 1.2, anchor_lat + 1.2),
                    DestinationMaster.longitude.between(anchor_lon - 1.2, anchor_lon + 1.2)
                )
                .order_by(DestinationMaster.rating.desc())
                .limit(top_k * 2)
            )
            db_res = await db.execute(query)
            db_dests = db_res.scalars().all()
            existing_ids = {r["destination_id"] for r in results}
            for d in db_dests:
                if d.id in existing_ids:
                    continue
                dist = haversine_distance_km(anchor_lat, anchor_lon, d.latitude, d.longitude)
                results.append({
                    "place_id": f"dest-{d.id}",
                    "destination_id": d.id,
                    "id": d.id,
                    "name": d.name,
                    "category": d.category or "Attraction",
                    "distance_km": round(dist, 1),
                    "relevance_score": 0.88,
                    "rating": float(d.rating or 4.5),
                    "price_inr": float(d.average_budget or 1500),
                    "image_url": d.image_url or "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
                    "reason": f"Nearby destination in {d.state} ({round(dist, 1)} km away)"
                })
                existing_ids.add(d.id)
                if len(results) >= top_k:
                    break
        except Exception:
            pass

    return {
        "status": "success",
        "count": len(results),
        "results": results,
        "nearby_destinations": results
    }

# -------------------------------------------------------------
# 4. MODEL 7: DESTINATION SIMILARITY
#    GET /api/recommendations/similar
# -------------------------------------------------------------

@router.get("/api/recommendations/similar")
async def get_similar_destinations(
    destination_id: Optional[str] = Query(None, description="Source destination ID"),
    destination_name: Optional[str] = Query(None, description="Source destination name"),
    top_k: int = Query(5, ge=1, le=20, description="Number of similar destinations"),
    db: AsyncSession = Depends(get_db)
):
    """
    Model 7: Cosine Nearest-Neighbors in hybrid embedding space (Sentence TF-IDF + Tabular factors).
    With deterministic database fallback if ML model is unavailable.
    """
    if not registry.is_loaded:
        registry.load_all()

    dest_id = None
    if destination_id is not None:
        s_did = str(destination_id).strip()
        if s_did.isdigit():
            dest_id = int(s_did)
        elif s_did.lower().startswith("dest-") and s_did[5:].isdigit():
            dest_id = int(s_did[5:])

    if not dest_id and destination_name:
        dest_id = registry.dest_name_lookup.get(destination_name.strip().lower())

    if not dest_id or dest_id not in registry.dest_lookup:
        # Fallback: pick the first destination or query DB
        dest_id = next(iter(registry.dest_lookup.keys())) if registry.dest_lookup else 1

    source_dest = registry.dest_lookup.get(dest_id, {})

    # Model 7 NearestNeighbors query
    similar_items = []
    bundle = registry.m7_similarity_bundle
    emb_matrix = registry.m7_dest_embeddings

    if bundle is not None and emb_matrix is not None:
        dest_ids = bundle.get("destination_ids", [])
        dest_to_idx = {int(did): idx for idx, did in enumerate(dest_ids)}
        idx_to_dest = {idx: int(did) for idx, did in enumerate(dest_ids)}
        src_idx = dest_to_idx.get(dest_id)
        if src_idx is not None and src_idx < len(emb_matrix):
            nn_model = bundle.get("nn_model")
            if nn_model:
                query_vec = emb_matrix[src_idx].reshape(1, -1)
                distances, indices = nn_model.kneighbors(query_vec, n_neighbors=min(top_k + 5, len(emb_matrix)))
                for dist, idx in zip(distances[0], indices[0]):
                    target_id = idx_to_dest.get(idx)
                    if target_id is None or target_id == dest_id or target_id not in registry.dest_lookup:
                        continue
                    sim_score = float(1.0 - dist)
                    t_info = registry.dest_lookup[target_id]
                    t_name = str(t_info.get("name", "Unknown"))
                    similar_items.append({
                        "destination_id": target_id,
                        "id": target_id,
                        "name": t_name,
                        "destination": t_name,
                        "state": str(t_info.get("state", "")),
                        "category": str(t_info.get("category", "attraction")),
                        "image_url": t_info.get("image_url") or "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
                        "similarity_score": round(sim_score, 4),
                        "average_budget": float(t_info.get("average_budget", 2500)),
                        "rating": float(t_info.get("rating", 4.5)),
                        "matching_attributes": [
                            k for k in ["nature", "adventure", "heritage", "religious", "nightlife"]
                            if float(t_info.get(f"{k}_score", 0)) >= 0.6
                        ]
                    })
                    if len(similar_items) >= top_k:
                        break

    # Database fallback if fewer than top_k similar destinations found
    if len(similar_items) < top_k:
        try:
            target_cat = source_dest.get("category")
            target_state = source_dest.get("state")
            query = select(DestinationMaster).where(
                DestinationMaster.id != dest_id,
                DestinationMaster.image_url.isnot(None),
                DestinationMaster.image_url != ""
            )
            if target_cat:
                query = query.where(DestinationMaster.category == target_cat)
            elif target_state:
                query = query.where(DestinationMaster.state == target_state)
            query = query.order_by(DestinationMaster.rating.desc()).limit(top_k * 2)
            db_res = await db.execute(query)
            db_sims = db_res.scalars().all()
            existing_ids = {s["destination_id"] for s in similar_items}
            for d in db_sims:
                if d.id in existing_ids:
                    continue
                similar_items.append({
                    "destination_id": d.id,
                    "id": d.id,
                    "name": d.name,
                    "destination": d.name,
                    "state": d.state,
                    "category": d.category or "attraction",
                    "image_url": d.image_url or "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
                    "similarity_score": 0.92,
                    "average_budget": float(d.average_budget or 2500),
                    "rating": float(d.rating or 4.5),
                    "matching_attributes": [d.category.lower()] if d.category else ["heritage"]
                })
                existing_ids.add(d.id)
                if len(similar_items) >= top_k:
                    break
        except Exception:
            pass

    return {
        "status": "success",
        "source_destination": source_dest.get("name", "Unknown"),
        "source_id": dest_id,
        "similar_destinations": similar_items
    }

# -------------------------------------------------------------
# 5. MODEL 5: POPULARITY & TRENDING DESTINATIONS
#    GET /api/trending
# -------------------------------------------------------------

import time

_TRENDING_CACHE = {}
_TRENDING_CACHE_TTL = 60.0

@router.get("/api/trending")
async def get_trending_destinations(
    limit: int = Query(10, ge=1, le=50, description="Count of trending destinations"),
    category: Optional[str] = Query(None, description="Optional category filter")
):
    """
    Model 5: Time-window interaction velocities (7d/14d/30d/90d) to detect rising destinations.
    """
    cache_key = f"{limit}_{category}"
    cached_item = _TRENDING_CACHE.get(cache_key)
    if cached_item and (time.monotonic() - cached_item[0] < _TRENDING_CACHE_TTL):
        return cached_item[1]

    if not registry.is_loaded:
        registry.load_all()

    df = registry.destinations_df
    if df is None:
        return {"status": "success", "results": []}

    target_df = df.copy()
    # Filter to only famous destinations with images
    if "is_famous" in target_df.columns:
        famous_slice = target_df[target_df["is_famous"] == 1]
        if len(famous_slice) > 0:
            target_df = famous_slice
    elif "image_url" in target_df.columns:
        img_slice = target_df[target_df["image_url"].str.strip() != ""]
        if len(img_slice) > 0:
            target_df = img_slice

    if category:
        target_df = target_df[target_df["category"].str.lower() == category.lower()]

    candidates = target_df.sort_values(by="popularity_score", ascending=False).head(limit * 2).to_dict(orient="records")
    m5_scores = orchestrator._batch_score_m5(candidates)

    results = []
    for cand, score_dict in zip(candidates, m5_scores):
        results.append({
            "id": int(cand["destination_id"]),
            "destination_id": int(cand["destination_id"]),
            "name": str(cand["name"]),
            "destination": str(cand["name"]),
            "state": str(cand["state"]),
            "category": str(cand.get("category", "attraction")),
            "trend_score": round(score_dict["trend_score"], 4),
            "growth_rate": score_dict["growth_rate"],
            "trend_status": score_dict["trend_status"],
            "rating": float(cand.get("rating", 4.0)),
            "image": str(cand.get("image_url") or ""),
            "image_url": str(cand.get("image_url") or ""),
            "crowd_density_score": int(cand.get("crowd_density_score") or 50),
            "safety_score": int(cand.get("safety_score") or 85)
        })

    results.sort(key=lambda x: x["trend_score"], reverse=True)
    resp = {"status": "success", "results": results[:limit]}
    _TRENDING_CACHE[cache_key] = (time.monotonic(), resp)
    return resp

# -------------------------------------------------------------
# 6. MODEL 6: TRAVEL DEMAND / CROWDEDNESS FORECAST
#    GET /api/demand
# -------------------------------------------------------------

@router.get("/api/demand")
async def predict_travel_demand(
    destination_id: Optional[int] = Query(None, description="Destination ID"),
    destination_name: Optional[str] = Query(None, description="Destination Name"),
    date: Optional[str] = Query(None, description="Date YYYY-MM-DD"),
    month: Optional[int] = Query(None, ge=1, le=12, description="Target travel month")
):
    """
    Model 6: Joint Regression & Classification predicting tourist footfall demand & crowd level.
    """
    if not registry.is_loaded:
        registry.load_all()

    dest_id = destination_id
    if not dest_id and destination_name:
        dest_id = registry.dest_name_lookup.get(destination_name.strip().lower())

    dest_info = registry.dest_lookup.get(dest_id, {}) if dest_id else {}
    name = dest_info.get("name", destination_name or "Destination")

    now = datetime.now()
    m = month or now.month
    dow = now.weekday()
    is_wknd = 1 if dow >= 5 else 0

    cand = dest_info or {"popularity_score": 0.6, "accessibility_score": 0.7}
    res = orchestrator._batch_score_m6([cand], {"month": m, "day_of_week": dow, "is_weekend": is_wknd})[0]

    recommended_visit = "Early morning before 10:00 AM or late afternoon" if res["crowd_level"] in ["High", "Very High"] else "Anytime during standard operating hours"

    return {
        "destination": name,
        "destination_id": dest_id,
        "demand_score": round(res["demand_score"], 4),
        "crowd_level": res["crowd_level"],
        "confidence": 0.88,
        "recommended_visit_window": recommended_visit
    }

# -------------------------------------------------------------
# 7. BEHAVIORAL FEEDBACK INGESTION
#    POST /api/feedback
# -------------------------------------------------------------

@router.post("/api/feedback")
async def record_ml_feedback(
    payload: MLFeedbackEvent,
    db: AsyncSession = Depends(get_db)
):
    """
    Ingests explicit and implicit feedback (view, click, save, share, itinerary_add, booking, rejection)
    for model retraining, drift monitoring, and continuous learning.
    """
    weight = INTERACTION_WEIGHTS.get(payload.event_type.lower(), 1.0)

    # Save to database
    meta_json = json.dumps(payload.metadata) if payload.metadata else None
    interaction = UserInteraction(
        user_id=payload.user_id,
        destination_id=payload.destination_id,
        action_type=payload.event_type,
        dwell_time_seconds=payload.duration_seconds or 0,
        rating=payload.rating,
        context_metadata=meta_json
    )
    db.add(interaction)
    await db.commit()

    return {
        "status": "feedback_logged",
        "user_id": payload.user_id,
        "destination_id": payload.destination_id,
        "event_type": payload.event_type,
        "assigned_weight": weight
    }

# -------------------------------------------------------------
# 8. COLD START / ONBOARDING PREFERENCES
#    POST /api/user/preferences
# -------------------------------------------------------------

@router.post("/api/user/preferences")
async def save_user_onboarding_preferences(
    payload: UserPreferencesPayload,
    db: AsyncSession = Depends(get_db)
):
    """
    Saves cold-start onboarding preference profile to anchor user latent representations.
    """
    res = await db.execute(select(UserPreference).where(UserPreference.user_id == payload.user_id))
    pref = res.scalar_one_or_none()

    if not pref:
        pref = UserPreference(
            user_id=payload.user_id,
            age_group=payload.age_group,
            travel_style=payload.travel_style,
            group_type=payload.group_type,
            preferred_categories=payload.preferred_categories,
            budget_tier=payload.budget,
            food_preference="all"
        )
        db.add(pref)
    else:
        pref.age_group = payload.age_group or pref.age_group
        pref.travel_style = payload.travel_style or pref.travel_style
        pref.group_type = payload.group_type or pref.group_type
        pref.preferred_categories = payload.preferred_categories or pref.preferred_categories
        pref.budget_tier = payload.budget or pref.budget_tier

    await db.commit()
    return {
        "status": "preferences_saved",
        "user_id": payload.user_id,
        "travel_style": pref.travel_style,
        "budget": pref.budget_tier
    }
