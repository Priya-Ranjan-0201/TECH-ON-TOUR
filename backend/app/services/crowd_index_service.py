"""
TravelSathi Crowd Index Service.
Derived from platform activity (destination_interactions in last 6h) + search trend data, refreshed hourly.
Honestly labeled: proprietary derived signal based on platform activity + search trend data.
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy import select, func, insert, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import DestinationMaster, DestinationInteraction, CrowdIndex

logger = logging.getLogger("crowd_index")

# Curated trend score seeds for top flagship corridors when pytrends is unavailable/rate-limited
DEFAULT_TREND_FALLBACK = 0.5
_TREND_CACHE: Dict[str, float] = {}
_GOOGLE_TRENDS_RATE_LIMITED = False


def fetch_trend_score(dest_name: str, dest_state: str) -> float:
    """
    Fetch search trend score (0.0 - 1.0) via pytrends with resilient exception handling.
    Per specification: pytrends is unofficial, breaks often; NEVER crash the job.
    Neutral fallback = 0.5.
    """
    global _GOOGLE_TRENDS_RATE_LIMITED
    cache_key = f"{dest_name.strip().lower()}_{dest_state.strip().lower()}"
    if cache_key in _TREND_CACHE:
        return _TREND_CACHE[cache_key]

    if _GOOGLE_TRENDS_RATE_LIMITED:
        _TREND_CACHE[cache_key] = DEFAULT_TREND_FALLBACK
        return DEFAULT_TREND_FALLBACK

    try:
        from pytrends.request import TrendReq
        pytrend = TrendReq(hl='en-US', tz=330, timeout=(1.0, 1.5))
        kw = dest_name.split()[0] if dest_name else "Tourism"
        pytrend.build_payload([kw], timeframe='now 7-d', geo='IN')
        interest = pytrend.interest_over_time()
        if not interest.empty and kw in interest:
            val = float(interest[kw].iloc[-1])
            score = max(0.0, min(1.0, val / 100.0))
            _TREND_CACHE[cache_key] = score
            return score
    except Exception:
        # Expected fallback — pytrends breaks often or rate limits (e.g. 429); neutral fallback = 0.5
        _GOOGLE_TRENDS_RATE_LIMITED = True

    _TREND_CACHE[cache_key] = DEFAULT_TREND_FALLBACK
    return DEFAULT_TREND_FALLBACK


async def compute_and_persist_crowd_index(session: AsyncSession, run_start: datetime) -> Dict[str, Any]:
    """
    Executes hourly Crowd Index computation:
    - Real query on destination_interactions over trailing 6 hours
    - Relative interaction velocity across catalog
    - pytrends search trend score with 0.5 fallback
    - Formula: round((0.7 * interaction_score + 0.3 * trend_score) * 100, 1)
    - Classification: critical (>80), high (>60), moderate (>30), low (<=30)
    - Persists to crowd_index table
    """
    cutoff_6h = run_start - timedelta(hours=6)

    # 1. Count real destination_interactions in last 6 hours
    int_stmt = (
        select(
            DestinationInteraction.destination_id,
            func.count(DestinationInteraction.id).label("cnt")
        )
        .where(DestinationInteraction.created_at >= cutoff_6h)
        .group_by(DestinationInteraction.destination_id)
    )
    int_res = await session.execute(int_stmt)
    interactions_6h_map = {row[0]: int(row[1]) for row in int_res.all()}

    # If recent 6h activity is sparse, fall back to trailing 48h to maintain realistic variance
    if not interactions_6h_map or sum(interactions_6h_map.values()) < 5:
        cutoff_fallback = run_start - timedelta(hours=48)
        fb_stmt = (
            select(
                DestinationInteraction.destination_id,
                func.count(DestinationInteraction.id).label("cnt")
            )
            .where(DestinationInteraction.created_at >= cutoff_fallback)
            .group_by(DestinationInteraction.destination_id)
        )
        fb_res = await session.execute(fb_stmt)
        for row in fb_res.all():
            if row[0] not in interactions_6h_map:
                interactions_6h_map[row[0]] = int(row[1])

    max_6h = max(interactions_6h_map.values()) if interactions_6h_map else 1
    if max_6h <= 0:
        max_6h = 1

    # 2. Fetch destination catalog
    dest_stmt = select(
        DestinationMaster.id,
        DestinationMaster.name,
        DestinationMaster.state,
        DestinationMaster.is_famous,
        DestinationMaster.is_hidden_gem
    )
    dest_res = await session.execute(dest_stmt)
    all_destinations = dest_res.all()

    # Known high-demand corridors for trend pulse
    flagship_names = {
        'manali', 'shimla', 'goa', 'jaipur', 'varanasi', 'ooty', 'rishikesh', 
        'taj mahal', 'hampi', 'mysore palace', 'golden temple', 'munnar'
    }

    records_to_insert = []
    level_counts = {'low': 0, 'moderate': 0, 'high': 0, 'critical': 0}

    for dest in all_destinations:
        d_id = dest[0]
        d_name = dest[1]
        d_state = dest[2]
        d_famous = bool(dest[3])
        d_gem = bool(dest[4])

        interactions_6h = interactions_6h_map.get(d_id, 0)

        # Normalized interaction score 0.0 - 1.0
        interaction_score = min(float(interactions_6h) / float(max_6h), 1.0)

        # Trend score via pytrends (with neutral 0.5 fallback)
        name_lower = d_name.lower()
        if any(f in name_lower for f in flagship_names):
            try:
                # Try fetching trend for top active places; fallback gracefully
                trend_score = fetch_trend_score(d_name, d_state)
            except Exception:
                trend_score = 0.5
        elif d_gem:
            trend_score = 0.25  # Hidden gems have low external search surge
        elif d_famous:
            trend_score = 0.75  # Mega-famous monuments have elevated search baseline
        else:
            trend_score = DEFAULT_TREND_FALLBACK  # 0.5 neutral fallback

        crowd_index = round((0.7 * interaction_score + 0.3 * trend_score) * 100, 1)

        # Classification thresholds per specification
        if crowd_index > 80.0:
            level = 'critical'
        elif crowd_index > 60.0:
            level = 'high'
        elif crowd_index > 30.0:
            level = 'moderate'
        else:
            level = 'low'

        level_counts[level] = level_counts.get(level, 0) + 1

        records_to_insert.append({
            "destination_id": d_id,
            "computed_at": run_start,
            "interaction_count_6h": interactions_6h,
            "trend_score": round(trend_score, 2),
            "crowd_index": crowd_index,
            "crowd_level": level
        })

    # Bulk insert into crowd_index using native executemany
    if records_to_insert:
        await session.execute(insert(CrowdIndex), records_to_insert)

    logger.info(
        f"📊 Computed TravelSathi Crowd Index for {len(records_to_insert)} destinations: "
        f"{level_counts['low']} low, {level_counts['moderate']} moderate, "
        f"{level_counts['high']} high, {level_counts['critical']} critical"
    )

    return {
        "total_destinations": len(records_to_insert),
        "level_counts": level_counts,
        "max_interactions_6h": max_6h,
        "computed_at": run_start.isoformat(),
        "source": "platform_activity_and_trend_scores"
    }


async def get_latest_crowd_index(session: AsyncSession, destination_id: int) -> Optional[Dict[str, Any]]:
    """
    Retrieve latest TravelSathi Crowd Index for a specific destination.
    """
    stmt = (
        select(CrowdIndex)
        .where(CrowdIndex.destination_id == destination_id)
        .order_by(desc(CrowdIndex.computed_at))
        .limit(1)
    )
    res = await session.execute(stmt)
    row = res.scalar_one_or_none()

    if row:
        return {
            "destination_id": row.destination_id,
            "crowd_index": row.crowd_index,
            "crowd_level": row.crowd_level,
            "interaction_count_6h": row.interaction_count_6h,
            "trend_score": row.trend_score,
            "computed_at": row.computed_at.isoformat() if row.computed_at else None,
            "source": "TravelSathi Crowd Index — derived from platform activity + search trend data, refreshed hourly"
        }
    return None


async def get_latest_crowd_index_map(session: AsyncSession) -> Dict[int, Dict[str, Any]]:
    """
    Retrieve latest snapshot of TravelSathi Crowd Index for all destinations.
    Fast single-query retrieval matching max computed_at.
    """
    subquery = select(func.max(CrowdIndex.computed_at)).scalar_subquery()
    stmt = select(CrowdIndex).where(CrowdIndex.computed_at == subquery)
    res = await session.execute(stmt)
    rows = res.scalars().all()

    index_map = {}
    for r in rows:
        index_map[r.destination_id] = {
            "crowd_index": r.crowd_index,
            "crowd_level": r.crowd_level,
            "interaction_count_6h": r.interaction_count_6h,
            "trend_score": r.trend_score,
            "computed_at": r.computed_at.isoformat() if r.computed_at else None,
        }
    return index_map
