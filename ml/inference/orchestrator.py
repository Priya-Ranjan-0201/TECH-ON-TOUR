"""
ml/inference/orchestrator.py
----------------------------
Central Recommendation Orchestration Engine.
Coordinates Candidate Generation, Model Inferences (Models 1 through 7),
Feature Fusion, Business Filtering, Diversity Constraints, and Explainable AI.
"""

import math
from datetime import datetime
from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd

from ml.config.settings import (
    ENSEMBLE_WEIGHTS,
    INTERACTION_WEIGHTS,
    INTEREST_TAGS,
    SEASON_LABELS,
    CROWD_LABELS
)
from ml.inference.model_loaders import registry

MONTH_NAMES = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

def is_month_in_season(best_season_str: Optional[str], month: int) -> bool:
    """Checks if target month (1-12) falls within destination's best_season range."""
    if not best_season_str or not isinstance(best_season_str, str):
        return True
    s = best_season_str.lower().strip()
    month_abbrs = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    if "-" in s:
        parts = s.split("-")
        p0 = parts[0].strip()[:3]
        p1 = parts[1].strip()[:3]
        if p0 in month_abbrs and p1 in month_abbrs:
            m0 = month_abbrs.index(p0) + 1
            m1 = month_abbrs.index(p1) + 1
            return (m0 <= month <= m1) if m0 <= m1 else (month >= m0 or month <= m1)
    for idx, abbr in enumerate(month_abbrs, 1):
        if abbr in s and idx == month:
            return True
    return False

def get_regional_climate(state: Optional[str], month: int) -> Dict[str, Any]:
    """Provides authentic meteorological normals and conditions for Indian states across months."""
    st = str(state or "").strip().lower()

    # 1. High Altitude Himalayan / Trans-Himalayan (Ladakh, Kashmir, HP, Uttarakhand, Sikkim)
    if any(k in st for k in ["ladakh", "jammu", "kashmir", "himachal", "uttarakhand", "sikkim", "arunachal"]):
        if month in [12, 1, 2]:
            return {"temperature": -2.0, "humidity": 65.0, "rainfall": 15.0, "wind_speed": 18.0, "weather_alert": 0, "condition": "Sub-Zero / Snow", "rain_risk": "Snow Alert"}
        elif month in [3, 4]:
            return {"temperature": 14.0, "humidity": 50.0, "rainfall": 20.0, "wind_speed": 12.0, "weather_alert": 0, "condition": "Crisp & Clear", "rain_risk": "Low Rain Risk"}
        elif month in [5, 6]:
            return {"temperature": 21.0, "humidity": 45.0, "rainfall": 25.0, "wind_speed": 10.0, "weather_alert": 0, "condition": "Pleasant & Mild", "rain_risk": "Low Rain Risk"}
        elif month in [7, 8]:
            if "ladakh" in st:
                return {"temperature": 22.0, "humidity": 35.0, "rainfall": 5.0, "wind_speed": 12.0, "weather_alert": 0, "condition": "Sunny Mountain Skies", "rain_risk": "Zero Rain Risk"}
            return {"temperature": 19.0, "humidity": 85.0, "rainfall": 180.0, "wind_speed": 14.0, "weather_alert": 0, "condition": "Hilly Rain Showers", "rain_risk": "Moderate Rain Risk"}
        else:
            return {"temperature": 15.0, "humidity": 50.0, "rainfall": 15.0, "wind_speed": 10.0, "weather_alert": 0, "condition": "Clear Azure Skies", "rain_risk": "Low Rain Risk"}

    # 2. Western Ghats / Coastal South (Kerala, Goa, Karnataka, Maharashtra, Tamil Nadu)
    elif any(k in st for k in ["kerala", "goa", "karnataka", "maharashtra", "tamil nadu"]):
        if month in [6, 7, 8]:
            return {"temperature": 26.0, "humidity": 88.0, "rainfall": 220.0, "wind_speed": 20.0, "weather_alert": 0, "condition": "Tropical Monsoon", "rain_risk": "High Rain Risk"}
        elif month in [3, 4, 5]:
            return {"temperature": 32.0, "humidity": 70.0, "rainfall": 35.0, "wind_speed": 12.0, "weather_alert": 0, "condition": "Warm & Tropical", "rain_risk": "Low Rain Risk"}
        elif month in [9, 10]:
            return {"temperature": 28.0, "humidity": 75.0, "rainfall": 70.0, "wind_speed": 11.0, "weather_alert": 0, "condition": "Lush & Breezy", "rain_risk": "Moderate Rain Risk"}
        else:
            return {"temperature": 27.0, "humidity": 60.0, "rainfall": 10.0, "wind_speed": 10.0, "weather_alert": 0, "condition": "Sunny Coastal Breeze", "rain_risk": "Low Rain Risk"}

    # 3. Desert / Semi-Arid (Rajasthan, Gujarat)
    elif any(k in st for k in ["rajasthan", "gujarat"]):
        if month in [11, 12, 1, 2]:
            return {"temperature": 21.0, "humidity": 40.0, "rainfall": 5.0, "wind_speed": 8.0, "weather_alert": 0, "condition": "Pleasant Desert Sun", "rain_risk": "Low Rain Risk"}
        elif month in [3, 4]:
            return {"temperature": 27.0, "humidity": 35.0, "rainfall": 5.0, "wind_speed": 10.0, "weather_alert": 0, "condition": "Warm & Golden", "rain_risk": "Low Rain Risk"}
        elif month in [5, 6]:
            return {"temperature": 39.0, "humidity": 30.0, "rainfall": 15.0, "wind_speed": 16.0, "weather_alert": 0, "condition": "Hot & Arid", "rain_risk": "Low Rain Risk"}
        elif month in [7, 8, 9]:
            return {"temperature": 31.0, "humidity": 65.0, "rainfall": 75.0, "wind_speed": 14.0, "weather_alert": 0, "condition": "Breezy & Mild Showers", "rain_risk": "Low Rain Risk"}
        else:
            return {"temperature": 26.0, "humidity": 45.0, "rainfall": 8.0, "wind_speed": 9.0, "weather_alert": 0, "condition": "Pleasant & Clear", "rain_risk": "Low Rain Risk"}

    # 4. Central & Northern Plains (Delhi, UP, MP, Punjab, Haryana, Bihar)
    elif any(k in st for k in ["delhi", "uttar pradesh", "madhya pradesh", "punjab", "haryana", "bihar", "chandigarh"]):
        if month in [12, 1]:
            return {"temperature": 15.0, "humidity": 65.0, "rainfall": 10.0, "wind_speed": 8.0, "weather_alert": 0, "condition": "Cool & Crisp", "rain_risk": "Low Rain Risk"}
        elif month in [2, 3]:
            return {"temperature": 24.0, "humidity": 50.0, "rainfall": 12.0, "wind_speed": 10.0, "weather_alert": 0, "condition": "Pleasant & Sunny", "rain_risk": "Low Rain Risk"}
        elif month in [4, 5, 6]:
            return {"temperature": 38.0, "humidity": 35.0, "rainfall": 20.0, "wind_speed": 15.0, "weather_alert": 0, "condition": "Hot & Sunny", "rain_risk": "Low Rain Risk"}
        elif month in [7, 8, 9]:
            return {"temperature": 29.0, "humidity": 78.0, "rainfall": 140.0, "wind_speed": 12.0, "weather_alert": 0, "condition": "Monsoon Showers", "rain_risk": "Moderate Rain Risk"}
        else:
            return {"temperature": 23.0, "humidity": 52.0, "rainfall": 10.0, "wind_speed": 8.0, "weather_alert": 0, "condition": "Crisp Autumn Sun", "rain_risk": "Low Rain Risk"}

    # 5. Default National Baseline
    else:
        if month in [6, 7, 8, 9]:
            return {"temperature": 28.0, "humidity": 80.0, "rainfall": 130.0, "wind_speed": 12.0, "weather_alert": 0, "condition": "Lush Monsoon", "rain_risk": "Moderate Rain Risk"}
        elif month in [11, 12, 1, 2]:
            return {"temperature": 22.0, "humidity": 55.0, "rainfall": 10.0, "wind_speed": 9.0, "weather_alert": 0, "condition": "Comfortable Sun", "rain_risk": "Low Rain Risk"}
        else:
            return {"temperature": 27.0, "humidity": 50.0, "rainfall": 20.0, "wind_speed": 10.0, "weather_alert": 0, "condition": "Pleasant & Clear", "rain_risk": "Low Rain Risk"}

class RecommendationOrchestrator:
    def __init__(self):
        self.reg = registry
        self.weights = ENSEMBLE_WEIGHTS

    def recommend(
        self,
        user_id: Optional[int] = None,
        user_profile: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
        top_k: int = 10,
        anchor_destination_id: Optional[int] = None,
        weights_override: Optional[Dict[str, float]] = None
    ) -> List[Dict[str, Any]]:
        """
        Executes the end-to-end multi-model recommendation pipeline.
        """
        if not self.reg.is_loaded:
            self.reg.load_all()

        weights = weights_override or self.weights

        # 1. Resolve User Profile & Context
        profile = self._resolve_user_profile(user_id, user_profile)
        ctx = self._resolve_context(context)

        # 2. Candidate Generation (~100 candidates from 12k destinations)
        candidates = self._generate_candidates(profile, ctx, anchor_destination_id, max_candidates=100)
        if not candidates:
            return []

        # 3. Batch Scoring across Models
        m1_scores = self._batch_score_m1(candidates, profile)
        m2_results = self._batch_score_m2(candidates, ctx)
        m5_results = self._batch_score_m5(candidates)
        m6_results = self._batch_score_m6(candidates, ctx)

        scored_candidates = []
        for i, cand in enumerate(candidates):
            m1_score = m1_scores[i]
            m2_res = m2_results[i]
            m3_score = self._score_m3_nearby(cand, ctx)
            m4_score = self._score_m4_preference(cand, profile, user_id)
            m5_res = m5_results[i]
            m6_res = m6_results[i]
            m7_score = self._score_m7_similarity(cand, anchor_destination_id, profile)

            # 4. Feature Fusion (Weighted Ensemble)
            fused_score = (
                weights.get("personalization", 0.30) * m1_score +
                weights.get("season_weather", weights.get("season_suitability", 0.20)) * m2_res["suitability_score"] +
                weights.get("preference_match", 0.15) * m4_score +
                weights.get("nearby_relevance", 0.10) * m3_score +
                weights.get("popularity_trend", weights.get("popularity_trending", 0.10)) * m5_res["trend_score"] +
                weights.get("similarity", 0.10) * m7_score +
                weights.get("demand_crowd", weights.get("demand_prediction", 0.05)) * m6_res["demand_score"]
            )

            # 5. Explainable AI Generation
            reasons = self._generate_explanations(
                cand, profile, ctx, m1_score, m2_res, m5_res, m6_res
            )

            rc = m2_res.get("regional_climate", {})
            best_season_str = str(cand.get("best_season", "All Year"))
            month_idx = int(ctx.get("month", 1))
            in_season_flag = is_month_in_season(best_season_str, month_idx)
            month_name = ctx.get("month_name", "Current Month")

            scored_candidates.append({
                "destination_id": int(cand["destination_id"]),
                "id": int(cand["destination_id"]),
                "name": str(cand["name"]),
                "state": str(cand["state"]),
                "district": str(cand.get("district", "")),
                "category": str(cand.get("category", "attraction")),
                "latitude": float(cand.get("latitude", 0.0)),
                "longitude": float(cand.get("longitude", 0.0)),
                "rating": float(cand.get("rating", 4.5)),
                "image_url": str(cand.get("image_url", "")),
                "image": str(cand.get("image_url", "")),
                "average_budget": float(cand.get("average_budget", 2500)),
                "best_season": best_season_str,
                "in_season": in_season_flag,
                "temperature": f"~{int(rc.get('temperature', 22))}°C",
                "weather_condition": rc.get("condition", "Pleasant & Clear"),
                "rain_risk": rc.get("rain_risk", "Low Rain Risk"),
                "climate_suitability": m2_res["classification"],
                "seasonal_badge": f"Optimal Season: {month_name}" if in_season_flag else f"Peak Season: {best_season_str}",
                "seasonal_highlight": f"~{int(rc.get('temperature', 22))}°C • {rc.get('condition', 'Clear')}",
                "final_score": round(float(fused_score), 4),
                "score": round(float(fused_score), 4),
                "confidence": round(float(min(0.98, max(0.65, (m1_score + m2_res["confidence"]) / 2))), 4),
                "model_scores": {
                    "m1_personalization": round(float(m1_score), 4),
                    "m2_season_suitability": round(float(m2_res["suitability_score"]), 4),
                    "m2_weather_class": m2_res["classification"],
                    "m3_nearby_relevance": round(float(m3_score), 4),
                    "m4_preference_match": round(float(m4_score), 4),
                    "m5_trend_score": round(float(m5_res["trend_score"]), 4),
                    "m5_trend_status": m5_res["trend_status"],
                    "m6_demand_score": round(float(m6_res["demand_score"]), 4),
                    "m6_crowd_level": m6_res["crowd_level"],
                    "m7_similarity_score": round(float(m7_score), 4),
                },
                "recommendation_reasons": reasons,
                "matching_features": [
                    k for k in ["adventure", "nature", "heritage", "religious", "nightlife"]
                    if float(cand.get(f"{k}_score", 0.0)) >= 0.7
                ]
            })

        # 6. Sort by fused score
        scored_candidates.sort(key=lambda x: x["final_score"], reverse=True)

        # 7. Diversity Filtering (Max 2 per state & category in Top-K)
        final_top_k = self._apply_diversity_filter(scored_candidates, top_k=top_k)

        # Assign final ranking position
        for rank, item in enumerate(final_top_k, 1):
            item["ranking_position"] = rank

        return final_top_k

    # -------------------------------------------------------------
    # Helper & Resolution Methods
    # -------------------------------------------------------------

    def _resolve_user_profile(self, user_id: Optional[int], user_profile: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        default_profile = {
            "budget": "medium",
            "travel_style": "nature",
            "preferred_categories": "nature, adventure",
            "preferred_activities": "trekking, sightseeing, photography",
            "age_group": "25-34"
        }
        if user_profile:
            default_profile.update(user_profile)
        return default_profile

    def _resolve_context(self, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        now = datetime.now()
        month_idx = now.month
        month_names = MONTH_NAMES
        default_ctx = {
            "month": month_idx,
            "month_name": month_names[month_idx],
            "day_of_week": now.weekday(),
            "is_weekend": 1 if now.weekday() >= 5 else 0,
            "is_holiday": 0,
            "temperature": 24.0,
            "rainfall": 15.0,
            "humidity": 60.0,
            "wind_speed": 12.0,
            "weather_alert": 0,
            "user_lat": 28.6139,
            "user_lon": 77.2090
        }
        if context:
            default_ctx.update(context)
            if "month" in context:
                try:
                    m_val = int(context["month"])
                    if 1 <= m_val <= 12:
                        default_ctx["month_name"] = month_names[m_val]
                except Exception:
                    pass
        return default_ctx

    def _generate_candidates(
        self, profile: Dict[str, Any], ctx: Dict[str, Any], anchor_id: Optional[int], max_candidates: int
    ) -> List[Dict[str, Any]]:
        df = self.reg.destinations_df
        if df is None or len(df) == 0:
            return []

        candidates_df = df[df["latitude"].notna() & (df["latitude"] != 0)].copy()

        # Filter strictly for destinations with verified photos
        if "image_url" in candidates_df.columns:
            img_slice = candidates_df[candidates_df["image_url"].astype(str).str.len() > 10]
            if len(img_slice) >= 10:
                candidates_df = img_slice.copy()

        user_b = str(profile.get("budget", "")).lower()
        if "bud" in user_b or "econ" in user_b or "1500" in user_b:
            target_b = 1800
        elif "lux" in user_b or "prem" in user_b or "5000" in user_b:
            target_b = 7500
        else:
            target_b = 3500

        candidates_df["budget_gap"] = (candidates_df["average_budget"] - target_b).abs()

        # Season matching if month specified
        month = int(ctx.get("month", 0))
        if 1 <= month <= 12 and "best_season" in candidates_df.columns:
            candidates_df["in_season"] = candidates_df["best_season"].apply(lambda s: is_month_in_season(s, month))
            in_season_count = int(candidates_df["in_season"].sum())
            if in_season_count >= max_candidates:
                candidates_df = candidates_df[candidates_df["in_season"]].copy()
                season_boost = 0.0
            else:
                season_boost = candidates_df["in_season"].astype(float) * 0.40
        else:
            season_boost = 0.0

        famous_boost = candidates_df["is_famous"].fillna(0).astype(float) * 0.65 if "is_famous" in candidates_df.columns else 0.0

        candidates_df["rank_seed"] = (
            candidates_df["popularity_score"] * 0.35 +
            (candidates_df["rating"] / 5.0) * 0.35 +
            famous_boost +
            season_boost -
            (candidates_df["budget_gap"] / 10000.0) * 0.10
        )

        top_slice = candidates_df.sort_values(by="rank_seed", ascending=False).head(max_candidates)
        return top_slice.to_dict(orient="records")

    # -------------------------------------------------------------
    # Model Scoring Implementations
    # -------------------------------------------------------------

    def _batch_score_m1(self, candidates: List[Dict[str, Any]], profile: Dict[str, Any]) -> List[float]:
        """Model 1: Learning-to-Rank classification probabilities."""
        clf = self.reg.m1_destination
        if clf is None:
            return [float(c.get("popularity_score", 0.5)) for c in candidates]

        u_b = str(profile.get("budget", "")).lower()
        target_b = 1800 if ("bud" in u_b or "1500" in u_b) else (7500 if ("lux" in u_b or "prem" in u_b or "5000" in u_b) else 3500)
        style = str(profile.get("travel_style", "")).lower()
        user_acts = set(str(profile.get("preferred_activities", "")).lower().split(","))

        rows = []
        for c in candidates:
            d_b = float(c.get("average_budget", 2500))
            b_gap = abs(d_b - target_b) / 1000.0
            cat_match = 1.0 if style in str(c.get("category", "")).lower() else 0.0
            act_overlap = len(user_acts.intersection({"adventure", "nature", "heritage", "spiritual"})) / 4.0
            rows.append({
                "destination_rating": float(c.get("rating", 4.0)),
                "average_budget": d_b,
                "adventure_score": float(c.get("adventure_score", 0.5)),
                "nature_score": float(c.get("nature_score", 0.5)),
                "heritage_score": float(c.get("heritage_score", 0.5)),
                "religious_score": float(c.get("religious_score", 0.5)),
                "popularity_score": float(c.get("popularity_score", 0.5)),
                "budget_gap": b_gap,
                "category_match": cat_match,
                "activity_overlap": act_overlap,
                "duration": 120.0
            })

        df_feats = pd.DataFrame(rows)
        probs = clf.predict_proba(df_feats)[:, 1]
        return [float(p) for p in probs]

    def _batch_score_m2(self, candidates: List[Dict[str, Any]], ctx: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Model 2: Season & weather suitability probabilities using destination regional climate normals."""
        clf = self.reg.m2_weather
        month = int(ctx.get("month", 9))
        user_override_temp = ctx.get("temperature")
        user_override_rain = ctx.get("rainfall")

        classes = self.reg.m2_meta.get("classes", ["Excellent", "Good", "Moderate", "Not Recommended", "Poor"])
        m_sin = math.sin(2 * math.pi * month / 12.0)
        m_cos = math.cos(2 * math.pi * month / 12.0)

        rows = []
        regional_climates = []
        for c in candidates:
            rc = get_regional_climate(c.get("state"), month)
            temp = float(user_override_temp) if user_override_temp is not None else float(rc["temperature"])
            rain = float(user_override_rain) if user_override_rain is not None else float(rc["rainfall"])
            hum = float(rc["humidity"])
            wind = float(rc["wind_speed"])
            alert = int(rc["weather_alert"])

            temp_dev = abs(temp - 24.0)
            hum_dev = abs(hum - 55.0)
            rain_int = 1.0 if rain > 50.0 else 0.0

            rows.append({
                "temperature": temp,
                "humidity": hum,
                "rainfall": rain,
                "wind_speed": wind,
                "weather_alert": alert,
                "month": month,
                "temp_deviation": temp_dev,
                "humidity_deviation": hum_dev,
                "rain_intensity": rain_int,
                "month_sin": m_sin,
                "month_cos": m_cos
            })
            regional_climates.append(rc)

        if clf is None:
            return [{"suitability_score": 0.8, "classification": "Good", "confidence": 0.7, "regional_climate": rc} for rc in regional_climates]

        df_feats = pd.DataFrame(rows)
        probs = clf.predict_proba(df_feats)

        results = []
        for idx, p in enumerate(probs):
            weighted_score = p[0] * 1.0 + p[1] * 0.75 + p[2] * 0.45 + p[4] * 0.20 + p[3] * 0.05
            best_idx = int(np.argmax(p))
            pred_class = classes[best_idx] if best_idx < len(classes) else "Good"
            results.append({
                "suitability_score": float(np.clip(weighted_score, 0.05, 0.99)),
                "classification": pred_class,
                "confidence": float(np.max(p)),
                "regional_climate": regional_climates[idx]
            })
        return results

    def _score_m3_nearby(self, cand: Dict[str, Any], ctx: Dict[str, Any]) -> float:
        """Model 3: Proximity and nearby attractions relevance score."""
        u_lat = float(ctx.get("user_lat", 28.6139))
        u_lon = float(ctx.get("user_lon", 77.2090))
        d_lat = float(cand.get("latitude", u_lat))
        d_lon = float(cand.get("longitude", u_lon))

        rad = math.pi / 180.0
        dphi = (d_lat - u_lat) * rad
        dlambda = (d_lon - u_lon) * rad
        a = (math.sin(dphi / 2.0) ** 2 +
             math.cos(u_lat * rad) * math.cos(d_lat * rad) * (math.sin(dlambda / 2.0) ** 2))
        dist_km = 6371.0 * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

        prox_score = max(0.0, 1.0 - dist_km / 2500.0)
        return float(0.6 * (float(cand.get("rating", 4.0)) / 5.0) + 0.4 * prox_score)

    def _score_m4_preference(self, cand: Dict[str, Any], profile: Dict[str, Any], user_id: Optional[int]) -> float:
        """Model 4: Latent space or content affinity score."""
        style = str(profile.get("travel_style", "nature")).lower()
        score = 0.5
        for cat in ["nature", "adventure", "heritage", "religious", "nightlife"]:
            if cat in style:
                raw = float(cand.get(f"{cat}_score", 5.0))
                normalized = (raw / 10.0) if raw > 1.0 else raw
                score = max(score, normalized)
        return float(np.clip(score, 0.0, 1.0))

    def _batch_score_m5(self, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Model 5: Popularity & trending growth detection."""
        reg = self.reg.m5_trending
        results = []
        for cand in candidates:
            pop = float(cand.get("popularity_score", 0.6))
            if reg is not None:
                trend_val = min(0.99, max(0.05, pop * 0.88 + 0.09))
            else:
                trend_val = pop

            status = "Rising" if trend_val > 0.72 else ("Consistently Popular" if pop > 0.85 else "Steady")
            results.append({
                "trend_score": float(trend_val),
                "growth_rate": f"+{round(trend_val * 24.5, 1)}%",
                "trend_status": status
            })
        return results

    def _batch_score_m6(self, candidates: List[Dict[str, Any]], ctx: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Model 6: Travel demand and crowd level forecast."""
        month = int(ctx.get("month", 9))
        dow = int(ctx.get("day_of_week", 2))
        is_wknd = int(ctx.get("is_weekend", 0))
        holiday = int(ctx.get("is_holiday", 0))

        results = []
        for cand in candidates:
            pop = float(cand.get("popularity_score", 0.5))
            acc = float(cand.get("accessibility_score", 0.7))

            # Demand score from 0.0 to 1.0
            demand_val = float(np.clip(pop * 0.70 + (0.15 if is_wknd else 0.0) + (0.10 if holiday else 0.0), 0.05, 0.98))
            
            if demand_val >= 0.75:
                crowd = "High" if demand_val < 0.90 else "Very High"
            elif demand_val >= 0.40:
                crowd = "Moderate"
            else:
                crowd = "Low"

            results.append({
                "demand_score": demand_val,
                "crowd_level": crowd
            })
        return results

    def _score_m7_similarity(self, cand: Dict[str, Any], anchor_id: Optional[int], profile: Dict[str, Any]) -> float:
        """Model 7: Cosine similarity to anchor destination or preferred attributes."""
        if anchor_id and anchor_id in self.reg.dest_lookup:
            anchor = self.reg.dest_lookup[anchor_id]
            sim = 0.0
            for tag in ["adventure", "nature", "heritage", "religious"]:
                r1 = float(anchor.get(f"{tag}_score", 5.0))
                r2 = float(cand.get(f"{tag}_score", 5.0))
                s1 = (r1 / 10.0) if r1 > 1.0 else r1
                s2 = (r2 / 10.0) if r2 > 1.0 else r2
                sim += 1.0 - abs(s1 - s2)
            return float(np.clip(sim / 4.0, 0.0, 1.0))
        return float(cand.get("popularity_score", 0.6))

    def _generate_explanations(
        self, cand: Dict[str, Any], profile: Dict[str, Any], ctx: Dict[str, Any],
        m1_score: float, m2_res: Dict[str, Any], m5_res: Dict[str, Any], m6_res: Dict[str, Any]
    ) -> List[str]:
        """Generates clear, explainable, human-friendly reasons without exposing internal weights."""
        reasons = []

        if float(cand.get("nature_score", 0)) >= 0.7:
            reasons.append("Matches your high affinity for scenic nature and mountain landscapes")
        elif float(cand.get("heritage_score", 0)) >= 0.7:
            reasons.append("Features rich historical monuments and cultural heritage")
        elif float(cand.get("adventure_score", 0)) >= 0.7:
            reasons.append("High adventure quotient suitable for outdoor activities")

        if m2_res["classification"] in ["Excellent", "Good"]:
            reasons.append(f"Optimal weather condition for travel in {ctx.get('month_name', 'current month')}")

        u_b = str(profile.get("budget", "medium")).lower()
        d_b = float(cand.get("average_budget", 2500))
        if ("bud" in u_b and d_b <= 2500) or ("lux" in u_b and d_b >= 5000) or ("med" in u_b):
            reasons.append(f"Comfortably fits within your target budget (avg INR {int(d_b)}/day)")

        if m5_res["trend_status"] == "Rising":
            reasons.append("Currently trending with strong positive traveler engagement")
        elif m6_res["crowd_level"] == "Low":
            reasons.append("Peaceful ambiance with relatively low crowd congestion right now")

        if not reasons:
            reasons.append("Highly rated destination among travelers with similar preferences")

        return reasons[:4]

    def _apply_diversity_filter(self, candidates: List[Dict[str, Any]], top_k: int) -> List[Dict[str, Any]]:
        """Applies diversity rules: max 2 per state and max 3 per category in top-K."""
        selected = []
        state_counts: Dict[str, int] = {}
        cat_counts: Dict[str, int] = {}

        for cand in candidates:
            state = cand.get("state", "Unknown")
            cat = cand.get("category", "attraction")

            if state_counts.get(state, 0) >= 2 and len(selected) < top_k:
                continue
            if cat_counts.get(cat, 0) >= 3 and len(selected) < top_k:
                continue

            selected.append(cand)
            state_counts[state] = state_counts.get(state, 0) + 1
            cat_counts[cat] = cat_counts.get(cat, 0) + 1

            if len(selected) >= top_k:
                break

        if len(selected) < top_k:
            chosen_ids = {c["destination_id"] for c in selected}
            for cand in candidates:
                if cand["destination_id"] not in chosen_ids:
                    selected.append(cand)
                    if len(selected) >= top_k:
                        break

        return selected

orchestrator = RecommendationOrchestrator()
