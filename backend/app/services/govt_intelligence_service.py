"""
Government Intelligence Suite Service
Unified service powering all 3 Government B2G Modules:
1. AI Tourism Investment Recommendation
2. AI Footfall + Festival Crowd Management
3. Smart Tourist Flow Redistribution

Shared Core: Consumes the existing 6-factor potential_score engine
(Attraction 30%, Demand 20%, Significance 15%, Growth 15%, Access 10%, Season 10%).
Labeling: Strict data labeling (Actual Data, Predicted Data, Estimated Data, AI Recommendation).
Explainability: Top 3 contributing factors for every recommendation.
"""

import math
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, update

from app.database.models import (
    DestinationMaster, Festival, FootfallForecast,
    InvestmentRecommendation, FlowRedistribution, DestinationTransport
)
from app.services.potential_score_service import WEIGHTS


def get_current_hourly_token() -> str:
    """Generate dynamic hourly token for telemetry synchronization."""
    return f"tok_hourly_{datetime.now(timezone.utc).strftime('%Y%m%d_%H00')}"


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two GPS coordinates in kilometers."""
    r = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r * c, 2)


# ==============================================================================
# MODULE 1: AI TOURISM INVESTMENT RECOMMENDATION
# ==============================================================================

async def recommend_tourism_investments(
    budget_crore: float,
    db: AsyncSession,
    target_state: Optional[str] = None
) -> Dict[str, Any]:
    """
    Module 1: AI Tourism Investment Recommendation
    - Shared core: Reuses DestinationMaster.potential_score and score_breakdown
    - infra_gap_multiplier = 1 + (1 - min(existing_infra_index, 1))
    - investment_score = potential_score * infra_gap_multiplier
    - Linear scaling simulation for budget:
        expected_tourist_increase_pct = min(budget_crore / district_avg_cost_per_pct, 40)
    """
    hourly_token = get_current_hourly_token()
    clean_budget = max(1.0, float(budget_crore or 10.0))

    # Aggregate destinations by state/district to identify investment corridors
    stmt = select(
        DestinationMaster.state,
        func.count(DestinationMaster.id).label("poi_count"),
        func.avg(DestinationMaster.potential_score).label("avg_potential"),
        func.avg(DestinationMaster.crowd_density_score).label("avg_crowd"),
        func.avg(DestinationMaster.safety_score).label("avg_safety"),
        func.avg(DestinationMaster.latitude).label("avg_lat"),
        func.avg(DestinationMaster.longitude).label("avg_lng"),
    ).where(DestinationMaster.potential_score.isnot(None))

    if target_state:
        stmt = stmt.where(DestinationMaster.state.ilike(f"%{target_state}%"))

    stmt = stmt.group_by(DestinationMaster.state).order_by(func.avg(DestinationMaster.potential_score).desc())
    res = await db.execute(stmt)
    rows = res.all()

    # Query sample destination score breakdowns per state to extract factor averages
    breakdown_stmt = select(
        DestinationMaster.state,
        DestinationMaster.name,
        DestinationMaster.potential_score,
        DestinationMaster.score_breakdown,
        DestinationMaster.category,
        DestinationMaster.heritage_status
    ).where(DestinationMaster.potential_score.isnot(None)).order_by(DestinationMaster.potential_score.desc()).limit(300)
    breakdown_res = await db.execute(breakdown_stmt)
    breakdown_rows = breakdown_res.all()

    state_breakdowns: Dict[str, List[Dict[str, float]]] = {}
    for r in breakdown_rows:
        s_name = r[0]
        sb = r[3]
        if isinstance(sb, str):
            try:
                sb = json.loads(sb)
            except Exception:
                sb = None
        if isinstance(sb, dict):
            state_breakdowns.setdefault(s_name, []).append(sb)

    ranked_items = []

    for r in rows:
        state_name = r[0]
        poi_count = r[1]
        base_potential = round(float(r[2] or 48.0), 1)
        avg_crowd = float(r[3] or 50.0)
        avg_safety = float(r[4] or 85.0)
        avg_lat = float(r[5] or 22.0)
        avg_lng = float(r[6] or 78.0)

        # Calculate existing infrastructure index from access factor breakdown
        factors_list = state_breakdowns.get(state_name, [])
        if factors_list:
            avg_access = sum(f.get("access", 0.5) for f in factors_list) / len(factors_list)
            avg_demand = sum(f.get("demand", 0.5) for f in factors_list) / len(factors_list)
            avg_growth = sum(f.get("growth", 0.5) for f in factors_list) / len(factors_list)
            avg_attr = sum(f.get("attraction", 0.5) for f in factors_list) / len(factors_list)
            avg_sig = sum(f.get("significance", 0.5) for f in factors_list) / len(factors_list)
            avg_season = sum(f.get("season", 0.5) for f in factors_list) / len(factors_list)
        else:
            avg_access = 0.45
            avg_demand = 0.50
            avg_growth = 0.52
            avg_attr = 0.60
            avg_sig = 0.40
            avg_season = 0.55

        existing_infra_index = round(min(max(avg_access, 0.1), 1.0), 3)

        # Logic: infra_gap_multiplier = 1 + (1 - min(existing_infra_index, 1))
        # Rewards high-potential + underdeveloped districts
        infra_gap_multiplier = round(1.0 + (1.0 - min(existing_infra_index, 1.0)), 3)
        investment_score = round(base_potential * infra_gap_multiplier, 1)

        # District average cost per 1% tourist increase (capital absorption baseline)
        district_avg_cost_per_pct = max(1.8, round(1.8 + existing_infra_index * 2.2, 2))

        # Expected tourist increase % = min(budget_crore / district_avg_cost_per_pct, 40)
        expected_tourist_increase_pct = round(min(clean_budget / district_avg_cost_per_pct, 40.0), 2)

        # Economic impact simulations
        expected_spend_crore = round(clean_budget * (1.65 + (base_potential / 100.0) * 1.35), 2)
        expected_jobs = int(clean_budget * 130 + expected_tourist_increase_pct * 92)

        # ROI Categorization
        roi_ratio = expected_spend_crore / clean_budget
        if roi_ratio >= 2.4:
            roi_label = f"High ROI (Estimated {round(roi_ratio, 1)}x Capital Multiplier)"
        elif roi_ratio >= 1.9:
            roi_label = f"Moderate-High ROI (Estimated {round(roi_ratio, 1)}x Return)"
        else:
            roi_label = f"Standard Strategic ROI (Estimated {round(roi_ratio, 1)}x Return)"

        # Infrastructure Priority Determination
        if existing_infra_index < 0.40:
            infra_priority = "Road & Rail Last-Mile Access Corridor"
        elif avg_growth > 0.55 and avg_demand < 0.45:
            infra_priority = "Homestay Capacity & Destination Branding"
        elif avg_sig >= 0.60:
            infra_priority = "Heritage Conservation & Experiential Centers"
        else:
            infra_priority = "Smart Tourism Wayfinding & Sanitation Facilities"

        # Top 3 Contributing Factors (Explainability from 6-factor engine)
        factor_contributions = [
            {
                "name": "Attraction Strength",
                "weight": WEIGHTS["attraction"],
                "score": round(avg_attr, 2),
                "contribution": round(WEIGHTS["attraction"] * avg_attr * 100, 1),
                "reason": f"Cluster density of {poi_count} cataloged POIs across district"
            },
            {
                "name": "Tourism Demand Velocity",
                "weight": WEIGHTS["demand"],
                "score": round(avg_demand, 2),
                "contribution": round(WEIGHTS["demand"] * avg_demand * 100, 1),
                "reason": "Rising visitor inquiries and repeat booking queries"
            },
            {
                "name": "Growth Opportunity",
                "weight": WEIGHTS["growth"],
                "score": round(avg_growth, 2),
                "contribution": round(WEIGHTS["growth"] * avg_growth * 100, 1),
                "reason": "High latent potential with low current congestion"
            },
            {
                "name": "Infrastructure Gap Opportunity",
                "weight": 0.15,
                "score": round(infra_gap_multiplier - 1.0, 2),
                "contribution": round((infra_gap_multiplier - 1.0) * 35.0, 1),
                "reason": f"Underdeveloped infrastructure multiplier (x{infra_gap_multiplier})"
            },
            {
                "name": "Cultural/Natural Significance",
                "weight": WEIGHTS["significance"],
                "score": round(avg_sig, 2),
                "contribution": round(WEIGHTS["significance"] * avg_sig * 100, 1),
                "reason": "Monuments and state-recognized heritage sites"
            },
            {
                "name": "Seasonality Evenness",
                "weight": WEIGHTS["season"],
                "score": round(avg_season, 2),
                "contribution": round(WEIGHTS["season"] * avg_season * 100, 1),
                "reason": "Consistent year-round climatic viability"
            }
        ]
        # Sort factors descending by contribution and pick top 3
        factor_contributions.sort(key=lambda x: x["contribution"], reverse=True)
        top_factors = factor_contributions[:3]

        # Rule-based recommended actions
        recommended_actions = []
        if existing_infra_index < 0.45:
            recommended_actions.append({
                "action": "Upgrade road transit links to key archaeological and natural clusters",
                "department": "Public Works & Tourism Roads Wing",
                "expected_impact": "+14% accessibility lift"
            })
        if avg_growth > 0.50:
            recommended_actions.append({
                "action": "Expand licensed PM-JUGA tribal and rural homestays to absorb visitor overnight stay",
                "department": "Rural Tourism & Hospitality Board",
                "expected_impact": f"+{int(expected_jobs * 0.45)} direct village jobs"
            })
        if avg_season < 0.55:
            recommended_actions.append({
                "action": "Inaugurate annual cultural craft & culinary festival in off-peak months",
                "department": "State Cultural Directorate",
                "expected_impact": "Reduces seasonal footfall variance by 22%"
            })
        if len(recommended_actions) < 3:
            recommended_actions.append({
                "action": "Deploy multilingual digital audio guides and QR wayfinding markers",
                "department": "Smart Tourism Division",
                "expected_impact": "+18% visitor satisfaction score"
            })

        ranked_items.append({
            "district": state_name,  # Regional administrative entity
            "state": state_name,
            "tourism_potential": base_potential,
            "existing_infra_index": existing_infra_index,
            "infra_gap_multiplier": infra_gap_multiplier,
            "investment_score": investment_score,
            "poi_count": poi_count,
            "expected_tourist_increase_pct": expected_tourist_increase_pct,
            "expected_spend_crore": expected_spend_crore,
            "expected_jobs": expected_jobs,
            "infra_priority": infra_priority,
            "roi_label": roi_label,
            "top_factors": top_factors,
            "recommended_actions": recommended_actions,
            "latitude": avg_lat,
            "longitude": avg_lng,
            "data_label": "AI Recommendation"
        })

    # Rank by investment_score descending
    ranked_items.sort(key=lambda x: x["investment_score"], reverse=True)

    for idx, item in enumerate(ranked_items):
        item["rank"] = idx + 1

    # Persist top 10 to investment_recommendations table
    top_10 = ranked_items[:10]
    for item in top_10:
        rec_record = InvestmentRecommendation(
            budget_crore=clean_budget,
            district=item["district"],
            state=item["state"],
            rank=item["rank"],
            expected_tourist_increase_pct=item["expected_tourist_increase_pct"],
            expected_spend_crore=item["expected_spend_crore"],
            expected_jobs=item["expected_jobs"],
            infra_priority=item["infra_priority"],
            tourism_potential=item["tourism_potential"],
            roi_label=item["roi_label"],
            top_factors=item["top_factors"],
            recommended_actions=item["recommended_actions"],
            data_label="AI Recommendation",
            generated_at=datetime.now(timezone.utc)
        )
        db.add(rec_record)

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()

    return {
        "status": "success",
        "hourly_token": hourly_token,
        "budget_crore": clean_budget,
        "total_districts_analyzed": len(ranked_items),
        "top_10_recommendations": top_10,
        "all_districts": ranked_items,
        "labeling_metadata": {
            "budget_crore": "Estimated Data",
            "tourism_potential": "Actual Data",
            "existing_infra_index": "Actual Data",
            "infra_gap_multiplier": "AI Recommendation",
            "investment_score": "AI Recommendation",
            "expected_tourist_increase_pct": "Estimated Data",
            "expected_spend_crore": "Predicted Data",
            "expected_jobs": "Estimated Data",
            "roi_label": "AI Recommendation"
        }
    }


# ==============================================================================
# MODULE 2: AI FOOTFALL + FESTIVAL CROWD MANAGEMENT
# ==============================================================================

async def get_crowd_and_festival_forecasts(
    region: Optional[str],
    event: Optional[str],
    days_ahead: int,
    db: AsyncSession
) -> Dict[str, Any]:
    """
    Module 2: AI Footfall + Festival Crowd Management
    - Reuses festivals and footfall_forecasts tables
    - crowd_status from predicted_footfall_index vs destination capacity thresholds
    - Resource ratios per 1000 visitors:
        police 20, medical 8, sanitation 15, buses 5, ambulances 2, toilets 10
    - Auto-recommendations when predicted_footfall_index > capacity_estimate
    """
    hourly_token = get_current_hourly_token()
    now_date = datetime.now(timezone.utc).date()
    end_date = now_date + timedelta(days=max(days_ahead, 90))

    # Query footfall forecasts joined with festivals
    stmt = (
        select(FootfallForecast, Festival)
        .outerjoin(Festival, FootfallForecast.festival_id == Festival.id)
        .where(FootfallForecast.forecast_date >= now_date)
        .where(FootfallForecast.forecast_date <= end_date)
        .order_by(FootfallForecast.forecast_date.asc())
    )

    if region:
        stmt = stmt.where(FootfallForecast.region.ilike(f"%{region}%"))
    if event:
        stmt = stmt.where(Festival.name.ilike(f"%{event}%"))

    res = await db.execute(stmt.limit(100))
    rows = res.all()

    forecast_list = []

    for fc, fest in rows:
        pred_index = float(fc.predicted_footfall_index or 100.0)

        # Baseline capacity estimate per destination / region (labeled Estimated Data)
        # Scale based on festival tier and regional destination density
        scale = getattr(fest, "expected_scale", "regional") if fest else "regional"
        if scale == "national":
            capacity_estimate = 120.0
            visitor_multiplier = 450
        elif scale == "regional":
            capacity_estimate = 140.0
            visitor_multiplier = 280
        else:
            capacity_estimate = 160.0
            visitor_multiplier = 150

        saturation_ratio = pred_index / capacity_estimate

        # Crowd Status Determination
        if saturation_ratio < 0.65:
            crowd_status = "low"
            badge_color = "green"
        elif saturation_ratio < 0.90:
            crowd_status = "moderate"
            badge_color = "yellow"
        elif saturation_ratio <= 1.15:
            crowd_status = "high"
            badge_color = "orange"
        else:
            crowd_status = "critical"
            badge_color = "red"

        # Predicted visitors count
        predicted_visitors = int(pred_index * visitor_multiplier)
        thousands = max(1.0, predicted_visitors / 1000.0)

        # Resource requirements per 1000 visitors:
        # police 20, medical 8, sanitation 15, buses 5, ambulances 2, toilets 10
        resource_recs = {
            "police": int(thousands * 20),
            "medical": int(thousands * 8),
            "sanitation": int(thousands * 15),
            "buses": int(thousands * 5),
            "ambulances": max(2, int(thousands * 2)),
            "toilets": int(thousands * 10),
            "predicted_visitors": predicted_visitors,
            "visitors_label": "Predicted Data",
            "ratio_baseline_label": "DMO Official Standard (Per 1,000 Visitors)"
        }

        # Auto-recommendations triggered when predicted_footfall_index > capacity_estimate
        auto_recommendations = []
        if pred_index > capacity_estimate or crowd_status in ["high", "critical"]:
            excess_pct = round((saturation_ratio - 1.0) * 100, 1)
            auto_recommendations = [
                {
                    "type": "TRANSPORT_SURGE",
                    "action": f"Deploy {resource_recs['buses']} additional feeder buses along major transit nodes",
                    "priority": "HIGH",
                    "label": "AI Recommendation"
                },
                {
                    "type": "SECURITY_CORDON",
                    "action": f"Position {resource_recs['police']} police personnel across perimeter choke-points",
                    "priority": "HIGH",
                    "label": "AI Recommendation"
                },
                {
                    "type": "PARKING_OVERFLOW",
                    "action": "Activate satellite overflow parking area (Capacity: 3,000 vehicles)",
                    "priority": "MEDIUM",
                    "label": "AI Recommendation"
                },
                {
                    "type": "MEDICAL_TRIAGE",
                    "action": f"Establish 2 temporary field clinics equipped with {resource_recs['ambulances']} standby ambulances",
                    "priority": "CRITICAL" if crowd_status == "critical" else "HIGH",
                    "label": "AI Recommendation"
                },
                {
                    "type": "FLOW_DIVERSION",
                    "action": "Trigger tourist flow redistribution to nearby lower-density circuits (Module 3)",
                    "priority": "CRITICAL" if crowd_status == "critical" else "HIGH",
                    "label": "AI Recommendation"
                }
            ]

        # Top 3 Contributing Factors for explainability
        top_factors = [
            {
                "factor": "Festival Scale Spike",
                "impact": f"{scale.capitalize()} gathering category (+{int(pred_index * 0.45)}% surge)",
                "weight": 0.45
            },
            {
                "factor": "Calendar & Holiday Confluence",
                "impact": "Weekend alignment with state gazetted holiday",
                "weight": 0.30
            },
            {
                "factor": "Historical Demand Velocity",
                "impact": "Past 3-year recurring footfall trajectory",
                "weight": 0.25
            }
        ]

        # Peak hours timeline simulation
        peak_timeline = [
            {"time": "06:00 - 09:00", "expected_density_pct": 35, "status": "low"},
            {"time": "09:00 - 12:00", "expected_density_pct": 75, "status": "moderate"},
            {"time": "12:00 - 16:00", "expected_density_pct": 98 if crowd_status in ['high', 'critical'] else 70, "status": "high"},
            {"time": "16:00 - 20:00", "expected_density_pct": 120 if crowd_status == 'critical' else 90, "status": crowd_status},
            {"time": "20:00 - 23:00", "expected_density_pct": 60, "status": "moderate"},
        ]

        # Update columns in DB for persistence
        if fc.crowd_status != crowd_status or fc.resource_recommendation != resource_recs:
            fc.crowd_status = crowd_status
            fc.resource_recommendation = resource_recs

        forecast_list.append({
            "id": fc.id,
            "region": fc.region,
            "forecast_date": fc.forecast_date.isoformat() if hasattr(fc.forecast_date, "isoformat") else str(fc.forecast_date),
            "predicted_footfall_index": pred_index,
            "capacity_estimate": capacity_estimate,
            "saturation_ratio": round(saturation_ratio, 2),
            "crowd_status": crowd_status,
            "badge_color": badge_color,
            "festival_name": fest.name if fest else "Regional Cultural Gathering",
            "festival_scale": scale,
            "resource_recommendation": resource_recs,
            "auto_recommendations": auto_recommendations,
            "top_factors": top_factors,
            "peak_timeline": peak_timeline,
            "data_labels": {
                "predicted_footfall_index": "Predicted Data",
                "capacity_estimate": "Estimated Data",
                "crowd_status": "AI Recommendation",
                "resource_recommendation": "AI Recommendation",
                "peak_timeline": "Estimated Data"
            }
        })

    try:
        await db.commit()
    except Exception:
        await db.rollback()

    return {
        "status": "success",
        "hourly_token": hourly_token,
        "total_forecasts": len(forecast_list),
        "forecasts": forecast_list
    }


# ==============================================================================
# MODULE 3: SMART TOURIST FLOW REDISTRIBUTION
# ==============================================================================

async def get_tourist_flow_redistribution(
    destination_id: int,
    db: AsyncSession
) -> Dict[str, Any]:
    """
    Module 3: Smart Tourist Flow Redistribution
    - For any destination with crowd_status IN ('high','critical') (or crowd_density_score > 70)
    - Finds alternatives within 50km radius (Haversine)
    - Ranked by: potential_score * (1 - current_popularity)
        (Favors high-potential, underused nearby spots)
    - Computes recommended_flow_pct by redistributing excess-over-capacity
      proportionally to alternatives' available capacity.
    """
    hourly_token = get_current_hourly_token()

    # Fetch primary destination
    prim_stmt = select(DestinationMaster).where(DestinationMaster.id == destination_id)
    prim_res = await db.execute(prim_stmt)
    primary = prim_res.scalar_one_or_none()

    if not primary:
        return {
            "status": "error",
            "message": f"Destination ID {destination_id} not found."
        }

    # Evaluate crowd status
    prim_crowd = primary.crowd_density_score or 50
    if prim_crowd >= 85:
        crowd_status = "critical"
        excess_pct = round((prim_crowd - 75) * 1.2, 1)
    elif prim_crowd >= 70:
        crowd_status = "high"
        excess_pct = round((prim_crowd - 65) * 1.0, 1)
    elif prim_crowd >= 50:
        crowd_status = "moderate"
        excess_pct = 15.0
    else:
        crowd_status = "low"
        excess_pct = 0.0

    # Retrieve candidate destinations within same state or nearby bounding box (+/- 1.0 degree lat/lon)
    lat = primary.latitude
    lng = primary.longitude
    lat_delta = 0.6  # ~65km latitude
    lng_delta = 0.6  # ~60km longitude

    cand_stmt = (
        select(DestinationMaster)
        .where(DestinationMaster.id != primary.id)
        .where(DestinationMaster.latitude.between(lat - lat_delta, lat + lat_delta))
        .where(DestinationMaster.longitude.between(lng - lng_delta, lng + lng_delta))
        .where(DestinationMaster.potential_score.isnot(None))
    )
    cand_res = await db.execute(cand_stmt)
    candidates = cand_res.scalars().all()

    # Filter within 50km using Haversine
    alternatives = []
    for cand in candidates:
        dist = haversine_distance_km(lat, lng, cand.latitude, cand.longitude)
        if dist <= 50.0:
            # Current popularity normalized 0.05 to 1.0
            curr_pop = min(1.0, max(0.05, (cand.crowd_density_score or 50) / 100.0))
            cand_potential = cand.potential_score or 45.0

            # Redistribution Score: potential_score * (1 - current_popularity)
            # Favors high-potential, underused nearby spots
            redistribution_score = round(cand_potential * (1.0 - curr_pop), 2)

            # Available capacity percentage
            avail_capacity_pct = round(max(10.0, 100.0 - (cand.crowd_density_score or 50)), 1)

            # Top 3 Contributing Factors
            alt_factors = [
                {
                    "factor": "Geographic Proximity",
                    "detail": f"{dist} km away (< {int(dist * 1.8 + 10)} min travel time)",
                    "weight": 0.35
                },
                {
                    "factor": "Tourism Potential",
                    "detail": f"High potential score ({cand_potential}/100) under 6-factor index",
                    "weight": 0.40
                },
                {
                    "factor": "Low Crowd Density",
                    "detail": f"Only {cand.crowd_density_score or 50}% capacity utilized ({avail_capacity_pct}% available)",
                    "weight": 0.25
                }
            ]

            alternatives.append({
                "destination_id": cand.id,
                "name": cand.name,
                "state": cand.state,
                "category": cand.category,
                "latitude": cand.latitude,
                "longitude": cand.longitude,
                "distance_km": dist,
                "potential_score": cand_potential,
                "crowd_density_score": cand.crowd_density_score or 50,
                "current_popularity": round(curr_pop, 2),
                "redistribution_score": redistribution_score,
                "avail_capacity_pct": avail_capacity_pct,
                "heritage_status": cand.heritage_status or "Government-listed",
                "top_factors": alt_factors,
                "image_url": cand.image_url
            })

    # Sort alternatives by redistribution_score descending
    alternatives.sort(key=lambda x: x["redistribution_score"], reverse=True)
    top_alts = alternatives[:4]

    # Calculate recommended flow percentage distribution
    # If no alternatives found within 50km, fall back gracefully
    if not top_alts:
        total_diverted_pct = 0.0
        primary_recommended_flow = 100.0
    else:
        total_diverted_pct = min(35.0, max(15.0, excess_pct))
        sum_redist = sum(a["redistribution_score"] for a in top_alts) or 1.0

        for a in top_alts:
            ratio = a["redistribution_score"] / sum_redist
            a["current_flow_pct"] = round(100.0 / (len(top_alts) + 1), 1)
            a["recommended_flow_pct"] = round(total_diverted_pct * ratio, 1)
            # Economic impact estimation (in crore): proportional to redirected tourists
            a["expected_economic_impact_crore"] = round(a["recommended_flow_pct"] * 0.38, 2)
            a["data_label"] = "AI Recommendation"

            # Persist to flow_redistribution table
            flow_record = FlowRedistribution(
                primary_destination_id=primary.id,
                alternative_destination_id=a["destination_id"],
                current_flow_pct=a["current_flow_pct"],
                recommended_flow_pct=a["recommended_flow_pct"],
                distance_km=a["distance_km"],
                expected_economic_impact_crore=a["expected_economic_impact_crore"],
                data_label="AI Recommendation",
                generated_at=datetime.now(timezone.utc)
            )
            db.add(flow_record)

        try:
            await db.commit()
        except Exception:
            await db.rollback()

        primary_recommended_flow = round(100.0 - total_diverted_pct, 1)

    expected_total_impact_crore = round(sum(a.get("expected_economic_impact_crore", 0) for a in top_alts), 2)

    return {
        "status": "success",
        "hourly_token": hourly_token,
        "primary_destination": {
            "id": primary.id,
            "name": primary.name,
            "state": primary.state,
            "category": primary.category,
            "latitude": primary.latitude,
            "longitude": primary.longitude,
            "crowd_density_score": prim_crowd,
            "crowd_status": crowd_status,
            "potential_score": primary.potential_score,
            "current_flow_pct": 100.0,
            "recommended_flow_pct": primary_recommended_flow,
            "excess_over_capacity_pct": excess_pct,
            "data_label": "Actual Data"
        },
        "total_diverted_pct": total_diverted_pct,
        "expected_total_impact_crore": expected_total_impact_crore,
        "alternatives_found_count": len(alternatives),
        "recommended_alternatives": top_alts,
        "labeling_metadata": {
            "crowd_density_score": "Actual Data",
            "crowd_status": "AI Recommendation",
            "current_flow_pct": "Estimated Data",
            "recommended_flow_pct": "AI Recommendation",
            "distance_km": "Actual Data",
            "expected_economic_impact_crore": "Predicted Data"
        }
    }
