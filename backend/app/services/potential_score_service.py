import math
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Tuple, Optional, List

WEIGHTS = {
    'attraction': 0.30,
    'demand': 0.20,
    'significance': 0.15,
    'growth': 0.15,
    'access': 0.10,
    'season': 0.10
}

assert abs(sum(WEIGHTS.values()) - 1.0) < 0.001, "WEIGHTS must sum to 1.0"

SIGNIFICANCE_TIERS = {
    'unesco': 1.0,
    'asi_protected': 0.7,
    'state_recognized': 0.4,
    'unlisted': 0.1
}

def normalize_heritage_status(status_str: Optional[str]) -> str:
    if not status_str:
        return 'unlisted'
    s = status_str.lower().strip()
    if 'unesco' in s or 'world heritage' in s:
        return 'unesco'
    if 'asi' in s or 'protected' in s or 'monument' in s:
        return 'asi_protected'
    if 'state' in s or 'government-listed' in s or 'listed' in s:
        return 'state_recognized'
    if s in SIGNIFICANCE_TIERS:
        return s
    return 'unlisted'


def attraction_strength(dest: Dict[str, Any], all_dests: List[Dict[str, Any]]) -> float:
    """
    2.1 Attraction Strength (30%)
    Area agglomeration count of attractions + uniqueness bonus.
    """
    area_key = dest.get('city') or dest.get('state') or 'default'
    same_area_count = 0
    max_count = 1
    
    # Calculate counts per area
    area_counts: Dict[str, int] = {}
    for d in all_dests:
        c_key = d.get('city') or d.get('state') or 'default'
        is_attr = (d.get('category') or '').lower() in ['attraction', 'monument', 'sightseeing', 'heritage']
        if is_attr:
            area_counts[c_key] = area_counts.get(c_key, 0) + 1

    same_area_count = area_counts.get(area_key, 1)
    max_count = max(area_counts.values()) if area_counts else 1

    type_bonus = 0.2 if dest.get('is_hidden_gem') else 0.0
    raw = (same_area_count / max_count) + type_bonus
    return min(raw, 1.0)


def tourism_demand(dest: Dict[str, Any], interactions_list: List[Dict[str, Any]]) -> Tuple[float, Optional[str]]:
    """
    2.2 Tourism Demand (20%)
    Interaction velocity over past 30 days.
    If interactions_list is small (< 50), cold-start fallback kicks in.
    """
    if len(interactions_list) < 50:
        return 0.5, 'cold_start_bootstrap'

    now_utc = datetime.now(timezone.utc)
    thirty_days_ago = now_utc - timedelta(days=30)
    
    dest_id = dest.get('id')
    recent_interactions = [
        i for i in interactions_list 
        if i.get('destination_id') == dest_id and i.get('created_at', now_utc) >= thirty_days_ago
    ]
    
    # Find max per destination
    dest_counts: Dict[int, int] = {}
    for i in interactions_list:
        d_id = i.get('destination_id')
        if d_id is not None:
            dest_counts[d_id] = dest_counts.get(d_id, 0) + 1

    max_30d = max(dest_counts.values()) if dest_counts else 1
    score = min(len(recent_interactions) / max_30d, 1.0)
    return round(score, 4), None


def significance(dest: Dict[str, Any]) -> Tuple[float, Optional[str]]:
    """
    2.3 Cultural/Natural Significance (15%)
    Heritage tier lookup with graceful fallback.
    """
    raw_tier = dest.get('heritage_status')
    if not raw_tier:
        return 0.1, 'missing_heritage_defaulted'
    
    tier = str(raw_tier).lower().strip()
    if tier not in SIGNIFICANCE_TIERS:
        # Check normalized tier
        norm = normalize_heritage_status(tier)
        if norm in SIGNIFICANCE_TIERS:
            return SIGNIFICANCE_TIERS[norm], None
        return 0.1, 'unrecognized_tier_defaulted'
    return SIGNIFICANCE_TIERS[tier], None


def growth_opportunity(dest: Dict[str, Any], interactions_list: List[Dict[str, Any]], trend_slope: float = 0.0) -> float:
    """
    2.4 Growth Opportunity (15%)
    Identifies high-potential under-saturated POIs with upward trend.
    """
    if len(interactions_list) < 50:
        return 0.5

    curr_pop, _ = tourism_demand(dest, interactions_list)
    trend_slope_normalized = max(0.0, min((trend_slope + 1.0) / 2.0, 1.0))
    return round((1.0 - curr_pop) * trend_slope_normalized, 4)


def accessibility(dest: Dict[str, Any], transport_row: Optional[Dict[str, Any]], max_dist: float = 200.0) -> Tuple[float, Optional[str]]:
    """
    2.5 Accessibility Potential (10%)
    Distance to airport, rail, and highway.
    """
    if transport_row is None:
        return 0.3, 'no_transport_data'
    
    airport = transport_row.get('nearest_airport_km') or max_dist
    railway = transport_row.get('nearest_railway_km') or max_dist
    highway = transport_row.get('nearest_highway_km') or max_dist

    nearest = min(airport, railway, highway)
    score = round(max(0.0, 1.0 - (nearest / max_dist)), 4)
    return score, None


def seasonality_evenness(monthly_visits: Optional[Dict[int, float]]) -> Tuple[float, Optional[str]]:
    """
    2.6 Seasonality Evenness (10%)
    Lower coefficient of variation = higher evenness year-round.
    """
    if not monthly_visits or len(monthly_visits) < 3:
        return 0.5, 'insufficient_monthly_data'
    
    values = list(monthly_visits.values())
    mean = sum(values) / len(values)
    if mean == 0:
        return 0.5, 'zero_mean_defaulted'
    
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    cv = (variance ** 0.5) / mean
    return round(max(0.0, 1.0 - min(cv, 1.0)), 4), None


def calculate_destination_potential(
    dest: Dict[str, Any],
    all_dests: List[Dict[str, Any]],
    interactions_list: List[Dict[str, Any]],
    transport_row: Optional[Dict[str, Any]],
    monthly_visits: Optional[Dict[int, float]],
    trend_slope: float = 0.0
) -> Dict[str, Any]:
    """
    Compute total potential score and breakdown with confidence level.
    """
    is_bootstrap = len(interactions_list) < 50
    
    attraction_score = attraction_strength(dest, all_dests)
    
    if is_bootstrap:
        demand_score = 0.5
        growth_score = 0.5
        demand_flag = 'cold_start_bootstrap'
    else:
        demand_score, demand_flag = tourism_demand(dest, interactions_list)
        growth_score = growth_opportunity(dest, interactions_list, trend_slope)

    sig_score, sig_flag = significance(dest)
    access_score, access_flag = accessibility(dest, transport_row)
    season_score, season_flag = seasonality_evenness(monthly_visits)

    factors = {
        'attraction': attraction_score,
        'demand': demand_score,
        'significance': sig_score,
        'growth': growth_score,
        'access': access_score,
        'season': season_score
    }

    flags = [f for f in [demand_flag, sig_flag, access_flag, season_flag] if f]
    
    if is_bootstrap:
        confidence = 'bootstrap'
    elif flags:
        confidence = 'partial'
    else:
        confidence = 'full'

    raw_sum = sum(WEIGHTS[k] * factors[k] for k in WEIGHTS)
    final_score = round(max(0.0, min(raw_sum * 100.0, 100.0)), 1)

    return {
        'potential_score': final_score,
        'score_breakdown': factors,
        'score_confidence': confidence,
        'score_computed_at': datetime.now(timezone.utc).isoformat()
    }
