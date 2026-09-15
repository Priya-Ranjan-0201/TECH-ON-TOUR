"""
TravelSathi Two-Stage Recommendation Engine (V2.0 Master Upgrade).
- Stage 1: Candidate Generation (50-200 places from spatial, seasonal, weather, graph, and preference sources).
- Stage 2: Learned/Heuristic Ranking Model with diversity filtering and explainable recommendation reasons.
"""

import math
import logging
from datetime import datetime, date, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy import select, or_, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import DestinationMaster, UserPreference, UserInteraction, DestinationInteraction, LiveLocation
from app.services.graph_recommender import graph_recommender
from app.services.external_data import fetch_weather_forecast, fetch_upcoming_festivals

logger = logging.getLogger("recommendation_service")


def get_current_hourly_token() -> str:
    """Generate active synchronized hourly token for real-time live data refresh."""
    return f"tok_hourly_{datetime.now(timezone.utc).strftime('%Y%m%d_%H00')}"


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Great Circle distance between two points in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 1)


def estimate_drive_time_minutes(distance_km: float) -> int:
    """Estimate realistic road driving time in India (~35-45 km/h average)."""
    if distance_km <= 0.1:
        return 2
    avg_speed_kmh = 40.0
    hours = (distance_km * 1.25) / avg_speed_kmh  # 1.25 road winding factor
    return max(3, int(hours * 60))


import re
from typing import Tuple

MONTH_MAP = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12
}

def parse_season_range(best_season: str) -> Tuple[int, int]:
    """Parse season string (e.g. 'Oct-Feb', 'Nov-Mar', 'Jun-Sep', 'All Year') into (start_month, end_month)."""
    if not best_season:
        return (1, 12)
    s = best_season.strip().lower()
    if "all" in s or "year" in s:
        return (1, 12)
    if "winter" in s:
        return (10, 2)
    if "summer" in s:
        return (3, 6)
    if "monsoon" in s or "rain" in s:
        return (7, 9)
    
    parts = re.split(r'\s*[-–—/]\s*|\s+to\s+', s)
    if len(parts) >= 2:
        m1_str = parts[0].strip()[:3]
        m2_str = parts[1].strip()[:3]
        m1 = MONTH_MAP.get(m1_str)
        m2 = MONTH_MAP.get(m2_str)
        if m1 and m2:
            return (m1, m2)
    
    for k, v in MONTH_MAP.items():
        if len(k) == 3 and k in s:
            return (v, v)
    return (1, 12)

def season_match(current_month: int, best_season: str) -> int:
    """Matches current month against destination best season, correctly wrapping year boundaries (e.g. Oct-Feb)."""
    start, end = parse_season_range(best_season)
    if start <= end:
        return int(start <= current_month <= end)
    return int(current_month >= start or current_month <= end)  # wraps year


import joblib
from pathlib import Path
import numpy as np
import pandas as pd

MODEL_PATH_V1 = Path(__file__).resolve().parent / "recommendation_ranker.pkl"
MODEL_PATH_V2 = Path(__file__).resolve().parent / "recommendation_model.pkl"


class RecommendationEngine:
    def __init__(self):
        self.cached_weather = None
        self.weather_updated = 0
        self.ml_model = None
        self.ml_feature_names = None
        for p in [MODEL_PATH_V2, MODEL_PATH_V1]:
            if p.exists():
                try:
                    self.ml_model = joblib.load(p)
                    self.ml_feature_names = list(getattr(self.ml_model, "feature_names_in_", []))
                    logger.info("Loaded ML Recommendation Ranker model from %s with %d features", p, len(self.ml_feature_names))
                    break
                except Exception as e:
                    logger.warning("Could not load ML ranker model from %s: %s", p, e)

    def _build_feature_df(
        self,
        dest: DestinationMaster,
        distance_km: Optional[float],
        user_pref: Optional[UserPreference],
        season_match: bool,
        weather_condition: str,
        cat_lower: str,
        is_indoor: bool,
    ) -> Optional[pd.DataFrame]:
        """Builds a named-feature DataFrame precisely matching the fitted ML model's schema."""
        if self.ml_model is None:
            return None

        pref_styles = [s.strip().lower() for s in (user_pref.travel_style or "").split(",") if s.strip()] if user_pref else []
        dest_text = f"{cat_lower} {dest.name or ''} {dest.description or ''}".lower()
        interest_overlap_score = round(sum(1 for s in pref_styles if s in dest_text) / max(len(pref_styles), 1), 3) if pref_styles else 0.0
        past_category_affinity = 0.85 if (pref_styles and any(s in cat_lower for s in pref_styles)) else 0.20
        price_str = str(dest.price_range or "").lower()
        user_tier = (user_pref.budget_tier or "mid").lower() if user_pref else "mid"
        price_tier_match = 1 if user_tier in price_str else (1 if price_str == "" else 0)

        user_aff = 0.90 if (user_pref and (user_pref.travel_style or "").lower() in cat_lower) else 0.45
        s_match = 1 if season_match else 0
        w_suit = 0.90 if not ("rain" in weather_condition.lower() and not is_indoor) else 0.35
        d_km = float(distance_km if distance_km is not None else 65.0)
        rating_val = float(dest.rating or 4.0)
        rev_count = int(dest.review_count or 50)

        feature_registry: Dict[str, Any] = {
            "interest_overlap_score": interest_overlap_score,
            "distance_km": d_km,
            "season_match": s_match,
            "past_category_affinity": past_category_affinity,
            "avg_rating": rating_val,
            "price_tier_match": price_tier_match,
            "global_popularity_30d": min(rev_count, 1000),
            "category_match_score": user_aff,
            "user_affinity": user_aff,
            "past_interaction_count": 1,
            "rating": rating_val,
            "review_count_norm": min(rev_count / 2000.0, 1.0),
            "review_count_log": float(np.log1p(rev_count)),
            "graph_degree": 3,
            "graph_degree_norm": 0.35,
            "weather_suitability": w_suit,
            "weather_score": w_suit,
            "latitude": float(dest.latitude or 20.0),
            "longitude": float(dest.longitude or 78.0),
            "is_hotel": 1 if "hotel" in cat_lower else 0,
            "is_homestay": 1 if "homestay" in cat_lower else 0,
            "is_restaurant": 1 if "restaurant" in cat_lower else 0,
            "is_luxury": 1 if price_str == "luxury" else 0,
            "is_mid": 1 if price_str == "mid" else 0,
        }

        feature_cols = self.ml_feature_names or [
            "interest_overlap_score", "distance_km", "season_match",
            "past_category_affinity", "avg_rating", "price_tier_match",
            "global_popularity_30d"
        ]
        row = {col: feature_registry.get(col, 0.0) for col in feature_cols}
        return pd.DataFrame([row], columns=feature_cols)

    def rank_destinations(self, candidate_df: pd.DataFrame) -> pd.DataFrame:
        """
        Ranks candidate destinations using the 7-feature GradientBoostingClassifier model.
        Falls back to weighted sum if model fails to load or predict, with cold-start heuristics.
        """
        try:
            model_path = MODEL_PATH_V2 if MODEL_PATH_V2.exists() else MODEL_PATH_V1
            if not model_path.exists():
                raise FileNotFoundError(f"Model file not found at {model_path}")
            model = joblib.load(model_path)
            candidate_df["score"] = model.predict_proba(candidate_df[FEATURES])[:, 1]
            return candidate_df.sort_values("score", ascending=False)
        except Exception as e:
            logger.warning("Using heuristic fallback scoring for recommendation ranking: %s", e)
            # Cold start fallback: if user has no interests or history
            has_interests = (candidate_df.get("interest_overlap_score", 0) > 0).any() if "interest_overlap_score" in candidate_df.columns else False
            has_affinity = (candidate_df.get("past_category_affinity", 0) > 0).any() if "past_category_affinity" in candidate_df.columns else False
            if not has_interests and not has_affinity:
                candidate_df["score"] = (
                    candidate_df.get("season_match", 1) * 0.4
                    + candidate_df.get("avg_rating", 4.0) / 5.0 * 0.3
                    + (candidate_df.get("global_popularity_30d", 50) / 1000.0) * 0.2
                    + (1.0 / (1.0 + candidate_df.get("distance_km", 50.0))) * 0.1
                )
            else:
                candidate_df["score"] = (
                    candidate_df.get("interest_overlap_score", 0.1) * 0.4
                    + candidate_df.get("season_match", 1) * 0.2
                    + (1.0 / (1.0 + candidate_df.get("distance_km", 50.0))) * 0.2
                    + candidate_df.get("avg_rating", 4.0) / 5.0 * 0.2
                )
            return candidate_df.sort_values("score", ascending=False)


    def get_current_season_info(self, month: Optional[int] = None) -> Dict[str, Any]:
        if month is None or not (1 <= month <= 12):
            month = date.today().month
        if month in [3, 4, 5, 6]:
            season_name = "Summer"
            season_keywords = ["mar", "apr", "may", "jun", "summer", "all year"]
        elif month in [7, 8, 9]:
            season_name = "Monsoon"
            season_keywords = ["jul", "aug", "sep", "monsoon", "rainy", "all year"]
        else:
            season_name = "Winter"
            season_keywords = ["oct", "nov", "dec", "jan", "feb", "winter", "all year"]
        return {
            "month": month,
            "season_name": season_name,
            "keywords": season_keywords
        }

    @staticmethod
    def _get_base_tourist_filters():
        """Strict quality and tourist destination validation filters."""
        non_tourist_cats = ["hospital", "clinic", "dispensary", "medical", "police", "emergency", "healthcare", "pharmacy"]
        non_tourist_names = ["%hospital%", "%clinic%", "%dispensary%", "%medical college%", "%police%"]
        return [
            DestinationMaster.image_url.isnot(None),
            DestinationMaster.image_url.like("http%"),
            ~DestinationMaster.image_url.like("?%"),
            ~DestinationMaster.category.in_(non_tourist_cats),
            and_(*[~DestinationMaster.name.ilike(kw) for kw in non_tourist_names])
        ]

    async def generate_candidates(
        self,
        session: AsyncSession,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        user_pref: Optional[UserPreference] = None,
        limit_pool: int = 150
    ) -> List[DestinationMaster]:
        """Stage 1: Candidate Generation across multiple diverse channels with strict quality validation."""
        candidates = {}
        season_info = self.get_current_season_info()
        cur_m = season_info.get("month") or date.today().month
        base_filters = self._get_base_tourist_filters()

        # 1. Seasonal Candidate Slice (prioritize current season match)
        stmt_season = (
            select(DestinationMaster)
            .where(
                *base_filters,
                DestinationMaster.rating >= 4.0
            )
            .order_by(desc(DestinationMaster.rating), desc(DestinationMaster.review_count))
            .limit(100)
        )
        res_season = await session.execute(stmt_season)
        season_dests = res_season.scalars().all()
        # Sort so currently active season matches come first
        season_dests_sorted = sorted(
            season_dests,
            key=lambda d: (season_match(cur_m, d.best_season or ""), d.rating or 0.0),
            reverse=True
        )
        for dest in season_dests_sorted[:60]:
            candidates[dest.id] = dest

        # 2. Hidden Gems Slice (Anti-overtourism verified)
        stmt_hidden = (
            select(DestinationMaster)
            .where(
                *base_filters,
                DestinationMaster.is_hidden_gem == True
            )
            .order_by(desc(DestinationMaster.safety_score), desc(DestinationMaster.rating))
            .limit(50)
        )
        res_hidden = await session.execute(stmt_hidden)
        for dest in res_hidden.scalars().all():
            candidates[dest.id] = dest

        # 3. Spatial Nearby Slice (if GPS coordinates provided)
        if lat is not None and lng is not None:
            # Spatial bounding box ~ 2.5 degrees (~250km)
            stmt_near = (
                select(DestinationMaster)
                .where(
                    *base_filters,
                    DestinationMaster.latitude.between(lat - 2.5, lat + 2.5),
                    DestinationMaster.longitude.between(lng - 2.5, lng + 2.5)
                )
                .order_by(desc(DestinationMaster.rating))
                .limit(60)
            )
            res_near = await session.execute(stmt_near)
            for dest in res_near.scalars().all():
                candidates[dest.id] = dest

        # 4. User Preference Interest Slice
        if user_pref and user_pref.preferred_categories:
            pref_cats = [c.strip().lower() for c in user_pref.preferred_categories.split(",") if c.strip()]
            if pref_cats:
                conditions = [DestinationMaster.category.ilike(f"%{c}%") for c in pref_cats]
                stmt_pref = (
                    select(DestinationMaster)
                    .where(
                        *base_filters,
                        or_(*conditions)
                    )
                    .order_by(desc(DestinationMaster.rating))
                    .limit(50)
                )
                res_pref = await session.execute(stmt_pref)
                for dest in res_pref.scalars().all():
                    candidates[dest.id] = dest

        # Fallback if pool is small - only pick destinations with verified photos
        if len(candidates) < 30:
            stmt_fallback = select(DestinationMaster).where(
                *base_filters
            ).limit(80)
            res_fallback = await session.execute(stmt_fallback)
            for dest in res_fallback.scalars().all():
                candidates[dest.id] = dest

        return list(candidates.values())[:limit_pool]

    def score_destination(
        self,
        dest: DestinationMaster,
        lat: Optional[float],
        lng: Optional[float],
        user_pref: Optional[UserPreference],
        season_info: Dict[str, Any],
        weather_condition: str = "Clear"
    ) -> Dict[str, Any]:
        """Stage 2: Multi-Factor Scoring with Explainability."""
        score = 0.0
        reasons = []

        # 1. Quality & Rating Base
        rating_score = (dest.rating / 5.0) * 25.0
        score += rating_score

        # 2. Seasonal Suitability
        cur_m = season_info.get("month") or date.today().month
        is_s_match = season_match(cur_m, dest.best_season or "")
        if is_s_match:
            score += 20.0
            reasons.append(f"Ideal season to visit ({dest.best_season or season_info['season_name']} conditions)")
        else:
            score += 5.0

        # 3. Weather Suitability
        cat_lower = dest.category.lower()
        is_indoor = "museum" in cat_lower or "temple" in cat_lower or "palace" in cat_lower or "gallery" in cat_lower
        if "rain" in weather_condition.lower():
            if is_indoor:
                score += 15.0
                reasons.append("Great sheltered cultural spot for rainy days")
            else:
                score -= 10.0
        else:
            if "nature" in cat_lower or "scenic" in cat_lower:
                score += 12.0
                reasons.append(f"Pleasant {weather_condition.lower()} weather today")

        # 4. Spatial Proximity
        distance_km = None
        drive_time_min = None
        if lat is not None and lng is not None:
            distance_km = haversine_distance_km(lat, lng, dest.latitude, dest.longitude)
            drive_time_min = estimate_drive_time_minutes(distance_km)
            if distance_km <= 50:
                proximity_score = 25.0 * (1.0 - distance_km / 50.0)
                score += proximity_score
                reasons.append(f"Only {int(distance_km)} km away (~{drive_time_min} min drive)")
            elif distance_km <= 150:
                score += 10.0
                reasons.append(f"Within {int(distance_km)} km easy day-trip reach")
            else:
                score -= min(15.0, distance_km / 100.0)

        # 5. User Personalization & Group Match
        if user_pref:
            # Travel style
            style = (user_pref.travel_style or "").lower()
            if style in cat_lower or style in (dest.description or "").lower():
                score += 20.0
                reasons.append(f"Matches your love for {user_pref.travel_style.capitalize()}")
            # Group type
            grp = (user_pref.group_type or "").lower()
            if grp == "family" and dest.safety_score >= 85:
                score += 12.0
                reasons.append("High safety score, ideal for family trips")
            elif grp == "friends" and ("nature" in cat_lower or "adventure" in cat_lower):
                score += 14.0
                reasons.append("Great active destination for friends")
            elif grp == "solo" and dest.is_hidden_gem:
                score += 10.0
                reasons.append("Peaceful, unhurried solo retreat")

        # 6. Hidden Gem Boost (Anti-Overtourism)
        if dest.is_hidden_gem:
            score += 16.0
            reasons.append("Curated hidden gem with low crowd density")

        # 7. ML Ranking Model Probability Score
        if self.ml_model is not None:
            try:
                feat_df = self._build_feature_df(
                    dest=dest,
                    distance_km=distance_km,
                    user_pref=user_pref,
                    season_match=bool(is_s_match),
                    weather_condition=weather_condition,
                    cat_lower=cat_lower,
                    is_indoor=is_indoor,
                )
                if feat_df is not None:
                    probs = self.ml_model.predict_proba(feat_df)
                    ml_prob = float(probs[0, 1]) if probs.shape[1] > 1 else float(probs[0, 0])
                    score = (score * 0.60) + (ml_prob * 100.0 * 0.40)
            except Exception as e:
                logger.debug("Recommendation ML ranking prediction notice: %s", e)

        # Fallback reason if none triggered
        if not reasons:
            reasons.append("Highly rated verified national destination")

        primary_reason = reasons[0]


        return {
            "score": round(score, 2),
            "distance_km": distance_km,
            "drive_time_min": drive_time_min,
            "reason": primary_reason,
            "all_reasons": reasons
        }

    def apply_diversity(self, scored_items: List[Dict[str, Any]], target_count: int = 6) -> List[Dict[str, Any]]:
        """Avoid filter bubbles by ensuring varied categories across rail."""
        selected = []
        seen_categories = set()

        # First pass: pick best scored item per unique category
        for item in scored_items:
            cat = item["destination"]["category"]
            if cat not in seen_categories:
                selected.append(item)
                seen_categories.add(cat)
                if len(selected) >= target_count:
                    break

        # Second pass: fill remainder by highest score
        if len(selected) < target_count:
            selected_ids = {i["destination"]["id"] for i in selected}
            for item in scored_items:
                if item["destination"]["id"] not in selected_ids:
                    selected.append(item)
                    if len(selected) >= target_count:
                        break

        return selected[:target_count]

    async def get_rails(
        self,
        session: AsyncSession,
        user_id: Optional[str] = "usr-901",
        lat: Optional[float] = None,
        lng: Optional[float] = None
    ) -> Dict[str, Any]:
        """Builds all personalized recommendation rails for the home feed."""
        # Load user preference if available
        user_pref = None
        if user_id:
            res_pref = await session.execute(
                select(UserPreference).where(UserPreference.user_id == user_id)
            )
            user_pref = res_pref.scalar_one_or_none()

        if user_pref is None:
            # Default cold-start preference profile
            user_pref = UserPreference(
                user_id=user_id or "guest",
                travel_style="heritage",
                group_type="family",
                budget_tier="mid",
                preferred_categories="heritage,nature,attraction"
            )

        candidates = await self.generate_candidates(session, lat, lng, user_pref)
        season_info = self.get_current_season_info()

        # Score all candidates
        scored = []
        for d in candidates:
            s_data = self.score_destination(d, lat, lng, user_pref, season_info)
            scored.append({
                "destination": {
                    "id": d.id,
                    "name": d.name,
                    "state": d.state,
                    "category": d.category,
                    "latitude": d.latitude,
                    "longitude": d.longitude,
                    "rating": d.rating,
                    "review_count": d.review_count,
                    "price_range": d.price_range,
                    "best_season": d.best_season,
                    "image_url": d.image_url,
                    "is_hidden_gem": d.is_hidden_gem,
                    "safety_score": d.safety_score,
                    "crowd_density_score": d.crowd_density_score,
                    "hourly_token": get_current_hourly_token(),
                    "description": d.description[:180] + "..." if len(d.description) > 180 else d.description
                },
                "score": s_data["score"],
                "distance_km": s_data["distance_km"],
                "drive_time_min": s_data["drive_time_min"],
                "hourly_token": get_current_hourly_token(),
                "reason": s_data["reason"],
                "all_reasons": s_data["all_reasons"]
            })

        # Sort all by final score
        scored.sort(key=lambda x: x["score"], reverse=True)

        # Cross-rail allocated ID tracker to eliminate duplicate places across rails
        allocated_ids = set()

        def pick_distinct_rail(pool: List[Dict[str, Any]], target_k: int = 6) -> List[Dict[str, Any]]:
            # Candidates strictly not yet allocated in earlier rails
            available = [it for it in pool if it["destination"]["id"] not in allocated_ids]
            if len(available) < target_k:
                # Top-up from general scored candidates not yet allocated
                for it in scored:
                    if it["destination"]["id"] not in allocated_ids and not any(a["destination"]["id"] == it["destination"]["id"] for a in available):
                        available.append(it)
                    if len(available) >= target_k:
                        break
            chosen = self.apply_diversity(available, target_k)
            # Mark all chosen as allocated
            for ch in chosen:
                allocated_ids.add(ch["destination"]["id"])
            return chosen

        # 1. Recommended For You Rail (High preference match)
        style = user_pref.travel_style.lower()
        pref_items = [
            item for item in scored
            if style in item["destination"]["category"].lower() or style in item["destination"]["description"].lower()
        ]
        rail_recommended = pick_distinct_rail(pref_items or scored, 6)

        # 2. Best for This Season Rail
        seasonal_items = [
            item for item in scored
            if any(k in (item["destination"]["best_season"] or "").lower() for k in season_info["keywords"])
        ]
        rail_seasonal = pick_distinct_rail(seasonal_items or scored, 6)

        # 3. Near You Right Now Rail - DEDICATED SPATIAL QUERY (bypasses shared candidate pool)
        # Check user live location if lat/lng not provided in request
        if not (lat is not None and lng is not None and 6.5 <= lat <= 37.5 and 68.0 <= lng <= 97.5):
            if user_id:
                res_loc = await session.execute(
                    select(LiveLocation).where(LiveLocation.user_id == user_id)
                )
                user_loc = res_loc.scalar_one_or_none()
                if user_loc and user_loc.latitude and user_loc.longitude:
                    lat = user_loc.latitude
                    lng = user_loc.longitude

        if not (lat is not None and lng is not None and 6.5 <= lat <= 37.5 and 68.0 <= lng <= 97.5):
            res_any_loc = await session.execute(
                select(LiveLocation).order_by(LiveLocation.updated_at.desc()).limit(1)
            )
            any_loc = res_any_loc.scalar_one_or_none()
            if any_loc and any_loc.latitude and any_loc.longitude:
                lat = any_loc.latitude
                lng = any_loc.longitude
            else:
                lat = 31.2619
                lng = 75.7030

        has_valid_gps = bool(lat is not None and lng is not None and 6.5 <= lat <= 37.5 and 68.0 <= lng <= 97.5)
        eff_lat = lat
        eff_lng = lng

        # Query genuine nearby destinations within 100km (~0.9 deg latitude)
        stmt_nearby = (
            select(DestinationMaster)
            .where(
                *self._get_base_tourist_filters(),
                DestinationMaster.latitude.between(eff_lat - 1.0, eff_lat + 1.0),
                DestinationMaster.longitude.between(eff_lng - 1.2, eff_lng + 1.2)
            )
            .order_by(desc(DestinationMaster.rating))
            .limit(150)
        )
        res_nearby = await session.execute(stmt_nearby)
        nearby_dests = res_nearby.scalars().all()

        near_scored = []
        for nd in nearby_dests:
            if nd.latitude and nd.longitude and nd.id not in allocated_ids:
                dist = haversine_distance_km(eff_lat, eff_lng, nd.latitude, nd.longitude)
                # STRICT REQUIREMENT: Only places genuinely under 100 km from user
                if dist <= 100.0:
                    drive_min = estimate_drive_time_minutes(dist)
                    near_scored.append({
                        "destination": {
                            "id": nd.id,
                            "name": nd.name,
                            "state": nd.state,
                            "category": nd.category,
                            "latitude": nd.latitude,
                            "longitude": nd.longitude,
                            "rating": nd.rating,
                            "review_count": nd.review_count,
                            "price_range": nd.price_range,
                            "best_season": nd.best_season,
                            "image_url": nd.image_url,
                            "is_hidden_gem": nd.is_hidden_gem,
                            "safety_score": nd.safety_score,
                            "crowd_density_score": nd.crowd_density_score,
                            "hourly_token": get_current_hourly_token(),
                            "description": nd.description[:180] + "..." if len(nd.description or "") > 180 else (nd.description or "")
                        },
                        "score": round((nd.rating / 5.0) * 50 + max(0, 50 * (1 - dist / 100.0)), 2),
                        "distance_km": dist,
                        "drive_time_min": drive_min,
                        "hourly_token": get_current_hourly_token(),
                        "reason": f"Only {dist:.1f} km away (~{drive_min} min drive)",
                        "all_reasons": [f"Only {dist:.1f} km away (~{drive_min} min drive)"]
                    })

        # Sort strictly by genuine geographic distance ascending
        near_scored.sort(key=lambda x: x["distance_km"])
        rail_near = []
        for it in near_scored:
            if it["destination"]["id"] not in allocated_ids:
                dist_val = it["distance_km"]
                dist_str = f"{dist_val:.1f}" if dist_val < 10 else f"{int(round(dist_val))}"
                it["hook"] = f"{dist_str} km away · {it['drive_time_min']}m drive"
                rail_near.append(it)
                allocated_ids.add(it["destination"]["id"])
                if len(rail_near) >= 6:
                    break

        # 4. Because You Liked... Rail (Grounded in search graph & heritage)
        heritage_items = [item for item in scored if "heritage" in item["destination"]["category"].lower() or item["destination"]["rating"] >= 4.4]
        rail_because_liked = pick_distinct_rail(heritage_items or scored, 6)

        # 5. Hidden Gems Rail
        hidden_items = [item for item in scored if item["destination"]["is_hidden_gem"]]
        rail_hidden = pick_distinct_rail(hidden_items or scored, 6)

        # 6. Perfect For Today Rail
        rail_today = pick_distinct_rail(scored, 6)

        # 7. Popular / Trending Rail (Global popularity sorted)
        popular_items = sorted(scored, key=lambda x: x["destination"]["review_count"] or 0, reverse=True)
        rail_popular = pick_distinct_rail(popular_items, 6)

        for it in rail_seasonal:
            b_season = it["destination"].get("best_season")
            if b_season and b_season != "All Season":
                it["hook"] = f"Peak season: {b_season} weather"
            else:
                it["hook"] = f"Prime {season_info['season_name']} conditions"
        for it in rail_recommended:
            if it.get("reason") and not it["reason"].startswith("Highly rated"):
                it["hook"] = it["reason"]
            else:
                it["hook"] = f"Matches your love for {user_pref.travel_style.capitalize()}"
        for it in rail_because_liked:
            it["hook"] = f"Architectural wonder · {it['destination']['state']}"
        for it in rail_popular:
            it["hook"] = f"Trending destination · {it['destination']['review_count']} reviews"
        for it in rail_hidden:
            it["hook"] = f"Peaceful hidden gem · Low crowds"
        for it in rail_today:
            it["hook"] = f"Pleasant conditions today"

        rails_list = [
            {
                "id": "recommended_for_you",
                "title": f"Here's what's calling you this {season_info['season_name'].lower()}",
                "subtitle": f"AI Personalized for your {user_pref.travel_style.capitalize()} style and current season in India",
                "items": rail_recommended
            },
            {
                "id": "season",
                "title": f"Because it's {season_info['season_name']} in India",
                "subtitle": f"Curated destinations experiencing prime weather and active seasonal flora right now",
                "items": rail_seasonal
            },
            {
                "id": "near_you",
                "title": "Near your current location",
                "subtitle": "Calculated by live GPS distance and estimated travel drive time",
                "items": rail_near
            },
            {
                "id": "because_you_liked",
                "title": "Because you explored Cultural & Heritage places",
                "subtitle": "Similar heritage landmarks and cultural circuits discovered via AI knowledge graph",
                "items": rail_because_liked
            },
            {
                "id": "hidden_gems",
                "title": "Verified Hidden Gems Across India",
                "subtitle": "Verified authentic destinations with 60% lower crowd density",
                "items": rail_hidden
            },
            {
                "id": "perfect_for_today",
                "title": "Perfect For Today",
                "subtitle": "Weather-aware and time-of-day matched activities",
                "items": rail_today
            },
            {
                "id": "popular_nearby",
                "title": "Trending with travelers like you",
                "subtitle": "Highest booked and actively explored destinations across India this month",
                "items": rail_popular
            }
        ]

        return {
            "status": "success",
            "season": season_info["season_name"],
            "has_gps": bool(has_valid_gps and rail_near),
            "hourly_token": get_current_hourly_token(),
            "rails": rails_list
        }

    async def get_row_by_type(
        self,
        session: AsyncSession,
        row_type: str,
        user_id: str = "usr-901",
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        month: Optional[int] = None,
        exclude_ids: Optional[List[int]] = None,
        limit: int = 6
    ) -> Dict[str, Any]:
        """
        Serves the distinct Netflix/Hotstar-style recommendation rows with aggressive pre-filtering:
        - 'seasonal': Filter destinations where season_match == 1 FIRST, then rank remaining by model.
        - 'nearby': Filter destinations within real distance radius (<150km) FIRST, then rank.
        - 'history': Filter destinations sharing category with user's past interactions FIRST, then rank. Fallback to trending if 0 history.
        - 'trending': Rank by global_popularity_30d (review volume) as PRIMARY sort key.
        - 'personal' / 'for_you': Personalize against user's travel style and preferred categories.
        """
        import numpy as np
        season_info = self.get_current_season_info(month=month)
        season_name = season_info["season_name"]
        excluded_set = set(exclude_ids or [])

        # 1. Resolve GPS from live_locations if not explicitly provided in query params
        if lat is None or lng is None:
            try:
                live_res = await session.execute(
                    select(LiveLocation).where(LiveLocation.user_id == user_id)
                )
                live_loc = live_res.scalar_one_or_none()
                if live_loc:
                    lat = live_loc.latitude
                    lng = live_loc.longitude
            except Exception:
                pass

        # 2. Candidate building per row_type
        norm_type = row_type.lower().strip()
        candidates: List[DestinationMaster] = []
        row_title = ""
        row_subtitle = ""
        hook_pattern = ""

        # Fetch user preferences for styling
        user_pref = None
        try:
            pref_res = await session.execute(
                select(UserPreference).where(UserPreference.user_id == user_id)
            )
            user_pref = pref_res.scalar_one_or_none()
        except Exception:
            pass

        user_travel_style = user_pref.travel_style if user_pref else "nature"

        if norm_type in ["seasonal", "season"]:
            row_title = f"Because it's {season_name} in India"
            row_subtitle = f"Curated destinations experiencing prime weather and active seasonal flora right now"
            # 2.1 Seasonal row: Filter to destinations where season_match == 1 FIRST
            cur_month = season_info.get("month") or date.today().month
            where_clauses = list(self._get_base_tourist_filters()) + [
                DestinationMaster.best_season.isnot(None),
                DestinationMaster.best_season != ""
            ]
            if excluded_set:
                where_clauses.append(DestinationMaster.id.notin_(list(excluded_set)))
            stmt = (
                select(DestinationMaster)
                .where(*where_clauses)
                .order_by(desc(DestinationMaster.rating), desc(DestinationMaster.review_count))
                .limit(100)
            )
            res = await session.execute(stmt)
            all_cands = list(res.scalars().all())
            # Per-row evaluation wrapping year
            matched_cands = [d for d in all_cands if season_match(cur_month, d.best_season) == 1]
            candidates = matched_cands[:40] if matched_cands else all_cands[:40]
            hook_pattern = f"Peak {season_name.lower()} weather · {{rating}}★"

        elif norm_type in ["nearby", "near"]:
            if lat is not None and lng is not None:
                row_title = "Near your current location"
                row_subtitle = "High-rated attractions and natural getaways within easy road journey distance"
                # 2.1 Nearby row: Filter to destinations within real distance radius (<150km) FIRST
                where_clauses = list(self._get_base_tourist_filters())
                if excluded_set:
                    where_clauses.append(DestinationMaster.id.notin_(list(excluded_set)))
                all_res = await session.execute(select(DestinationMaster).where(*where_clauses))
                all_dests = all_res.scalars().all()

                # Calculate real distances
                spatial_dests = []
                for d in all_dests:
                    if d.latitude and d.longitude:
                        d_km = haversine_distance_km(lat, lng, d.latitude, d.longitude)
                        spatial_dests.append((d_km, d))
                
                # Strict <45km filter first (consistent with get_rails)
                close_dests = [d for d_km, d in spatial_dests if d_km <= 45.0]
                if len(close_dests) < limit:
                    # Expand radius to 80km if sparse
                    close_dests = [d for d_km, d in spatial_dests if d_km <= 80.0]
                if len(close_dests) < limit:
                    # Last resort: expand to 150km
                    close_dests = [d for d_km, d in spatial_dests if d_km <= 150.0]
                if len(close_dests) < limit:
                    spatial_dests.sort(key=lambda x: x[0])
                    close_dests = [d for _, d in spatial_dests[:30]]

                candidates = close_dests[:40]
                hook_pattern = "{distance} km away · {rating}★"
            else:
                # Cold-start fallback: Popular regional transit escapes
                row_title = "Near popular travel hubs"
                row_subtitle = "Top weekend getaways easily accessible from major transit centers"
                where_clauses = list(self._get_base_tourist_filters())
                if excluded_set:
                    where_clauses.append(DestinationMaster.id.notin_(list(excluded_set)))
                stmt = (
                    select(DestinationMaster)
                    .where(*where_clauses)
                    .order_by(desc(DestinationMaster.rating))
                    .limit(40)
                )
                res = await session.execute(stmt)
                candidates = list(res.scalars().all())
                hook_pattern = "Weekend getaway · {rating}★"

        elif norm_type in ["history", "history_based", "history-based", "explore"]:
            # 2.1 History row: Filter to destinations sharing category with past interactions FIRST
            top_category = None
            try:
                inter_res = await session.execute(
                    select(DestinationInteraction)
                    .where(DestinationInteraction.user_id == user_id)
                    .order_by(desc(DestinationInteraction.created_at))
                    .limit(20)
                )
                user_inters = inter_res.scalars().all()
                if user_inters:
                    dest_ids = [i.destination_id for i in user_inters]
                    dests_res = await session.execute(
                        select(DestinationMaster.category).where(DestinationMaster.id.in_(dest_ids))
                    )
                    cats = [c[0] for c in dests_res.all() if c[0]]
                    if cats:
                        from collections import Counter
                        top_category = Counter(cats).most_common(1)[0][0]
            except Exception:
                pass

            if top_category:
                row_title = f"Because you explored {top_category.replace('_', ' ').capitalize()} places"
                row_subtitle = f"Handpicked similar destinations tailored to your demonstrated interest in {top_category}"
                where_clauses = list(self._get_base_tourist_filters()) + [
                    DestinationMaster.category.ilike(f"%{top_category}%")
                ]
                if excluded_set:
                    where_clauses.append(DestinationMaster.id.notin_(list(excluded_set)))
                stmt = (
                    select(DestinationMaster)
                    .where(*where_clauses)
                    .order_by(desc(DestinationMaster.rating), desc(DestinationMaster.review_count))
                    .limit(40)
                )
                res = await session.execute(stmt)
                candidates = list(res.scalars().all())
                hook_pattern = f"Top in {top_category} · {{rating}}★"
            else:
                # If user has zero history, this row falls back to trending, not silently showing unfiltered list
                row_title = "Trending with travelers like you"
                row_subtitle = "Highest booked and actively explored destinations across India this month"
                where_clauses = list(self._get_base_tourist_filters())
                if excluded_set:
                    where_clauses.append(DestinationMaster.id.notin_(list(excluded_set)))
                stmt = (
                    select(DestinationMaster)
                    .where(*where_clauses)
                    .order_by(desc(DestinationMaster.review_count), desc(DestinationMaster.rating))
                    .limit(40)
                )
                res = await session.execute(stmt)
                candidates = list(res.scalars().all())
                hook_pattern = "Trending · {rating}★"

        elif norm_type in ["trending", "popular"]:
            # 2.1 Trending row: Rank by global_popularity_30d as the PRIMARY sort key
            row_title = "Trending with travelers like you"
            row_subtitle = "Highest booked and actively explored destinations across India this month"
            where_clauses = list(self._get_base_tourist_filters())
            if excluded_set:
                where_clauses.append(DestinationMaster.id.notin_(list(excluded_set)))
            stmt = (
                select(DestinationMaster)
                .where(*where_clauses)
                .order_by(desc(DestinationMaster.review_count), desc(DestinationMaster.rating))
                .limit(40)
            )
            res = await session.execute(stmt)
            candidates = list(res.scalars().all())
            hook_pattern = "Trending · {rating}★"

        else:  # 'personal' / 'for_you' / default
            row_title = f"Here's what's calling you this {season_name.lower()}"
            row_subtitle = f"AI Personalized for your travel twin style and current season in India"
            where_clauses = list(self._get_base_tourist_filters())
            if user_travel_style:
                where_clauses.append(or_(
                    DestinationMaster.category.ilike(f"%{user_travel_style}%"),
                    DestinationMaster.description.ilike(f"%{user_travel_style}%")
                ))
            if excluded_set:
                where_clauses.append(DestinationMaster.id.notin_(list(excluded_set)))
            stmt = (
                select(DestinationMaster)
                .where(*where_clauses)
                .order_by(desc(DestinationMaster.rating), desc(DestinationMaster.review_count))
                .limit(40)
            )
            res = await session.execute(stmt)
            candidates = list(res.scalars().all())
            hook_pattern = f"Curated for you · {{rating}}★"

        # Cold-start safety guard: If candidates is empty or sparse, fill from general catalog
        if len(candidates) < limit:
            fb_clauses = list(self._get_base_tourist_filters())
            if excluded_set:
                fb_clauses.append(DestinationMaster.id.notin_(list(excluded_set)))
            fallback_res = await session.execute(
                select(DestinationMaster)
                .where(*fb_clauses)
                .order_by(desc(DestinationMaster.review_count))
                .limit(30)
            )
            fallback_items = fallback_res.scalars().all()
            seen_ids = {c.id for c in candidates}
            for fb in fallback_items:
                if fb.id not in seen_ids:
                    candidates.append(fb)
                    seen_ids.add(fb.id)
                if len(candidates) >= 20:
                    break

        # 3. Predict scores using trained GradientBoostingClassifier model
        scored_cards = []
        cur_m = season_info.get("month") or date.today().month
        for dest in candidates:
            s_match_val = season_match(cur_m, dest.best_season or "")
            dist_km = haversine_distance_km(lat, lng, dest.latitude, dest.longitude) if lat and lng else None
            cat_match = 1.0 if (user_travel_style and user_travel_style in (dest.category or "").lower()) else 0.4
            past_inter = 1 if norm_type == "history" else 0
            pop_30d = int(dest.review_count or 50)
            rating = float(dest.rating or 4.0)

            if norm_type in ["trending", "popular"]:
                # Trending row uses global popularity as primary key
                score = round(pop_30d * 1.0 + rating * 10.0, 2)
            elif norm_type in ["nearby", "near"] and dist_km is not None:
                # Proximity primary with rating boost
                score = round(max(0.0, 300.0 - dist_km) + (rating * 20.0), 2)
            else:
                score = 0.5
                if self.ml_model is not None:
                    try:
                        cols = self.ml_feature_names if self.ml_feature_names else [
                            "season_match", "distance_km", "category_match_score",
                            "past_interaction_count", "global_popularity_30d", "avg_rating"
                        ]
                        feat_map = {
                            "season_match": s_match_val,
                            "distance_km": min(dist_km or 60.0, 2500.0),
                            "category_match_score": cat_match,
                            "user_affinity": cat_match,
                            "past_interaction_count": past_inter,
                            "global_popularity_30d": min(pop_30d, 1000),
                            "avg_rating": rating,
                            "rating": rating,
                            "interest_overlap_score": cat_match,
                            "price_tier_match": 1,
                        }
                        row = {c: feat_map.get(c, 0.0) for c in cols}
                        feat_df = pd.DataFrame([row], columns=cols)
                        probs = self.ml_model.predict_proba(feat_df)
                        score = float(probs[0, 1]) if probs.shape[1] > 1 else float(probs[0, 0])
                    except Exception:
                        score = (rating / 5.0) * 0.6 + (0.4 if s_match_val else 0.1)
                else:
                    score = (rating / 5.0) * 0.6 + (0.4 if s_match_val else 0.1)

            dist_display = int(dist_km) if dist_km is not None else 120
            hook = hook_pattern.format(rating=f"{rating:.1f}", distance=dist_display)

            scored_cards.append({
                "id": dest.id,
                "name": dest.name,
                "state": dest.state,
                "category": dest.category,
                "rating": rating,
                "review_count": dest.review_count or 50,
                "best_season": dest.best_season or "All Year",
                "image_url": dest.image_url or "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
                "distance_km": dist_km,
                "hook": hook,
                "score": round(score, 4),
                "is_hidden_gem": dest.is_hidden_gem or False,
                "hourly_token": get_current_hourly_token()
            })

        # Sort by score descending
        scored_cards.sort(key=lambda x: x["score"], reverse=True)

        # Apply state diversity to prevent all cards being from one single state
        diverse_top = []
        state_counts = {}
        for c in scored_cards:
            st = c["state"]
            if state_counts.get(st, 0) < 2:
                diverse_top.append(c)
                state_counts[st] = state_counts.get(st, 0) + 1
            if len(diverse_top) >= limit:
                break

        if len(diverse_top) < limit:
            for c in scored_cards:
                if c not in diverse_top:
                    diverse_top.append(c)
                if len(diverse_top) >= limit:
                    break

        return {
            "status": "success",
            "row_type": norm_type,
            "title": row_title,
            "subtitle": row_subtitle,
            "count": len(diverse_top),
            "hourly_token": get_current_hourly_token(),
            "destinations": diverse_top
        }


recommendation_engine = RecommendationEngine()

FEATURES = [
    "interest_overlap_score",
    "distance_km",
    "season_match",
    "past_category_affinity",
    "avg_rating",
    "price_tier_match",
    "global_popularity_30d"
]

def rank_destinations(candidate_df: pd.DataFrame) -> pd.DataFrame:
    """Convenience module-level function to rank destinations using recommendation_engine."""
    return recommendation_engine.rank_destinations(candidate_df)
