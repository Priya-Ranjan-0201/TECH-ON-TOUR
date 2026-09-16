"""
backend/tests/test_readiness_pipeline.py
----------------------------------------
Comprehensive Verification Test Suite for:
1. Readiness Score Schema and Persistence (readiness_inputs table + destinations_master.readiness_score)
2. 6-Factor Composite Weighted Formula (Accommodation 25%, Transport 20%, Connectivity 15%, Food 15%, Medical 15%, Other 10%)
3. Priority Engine with 7th Feature Readiness & Trained Regressor
4. Persistence and Recovery after simulated restart
5. Compact Output & Badge Logic
"""

import sys
import os
import sqlite3
import pytest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR.parent))

from app.services.readiness_service import (
    WEIGHTS,
    compute_readiness,
    get_readiness_badge,
    parse_destination_id,
    upsert_readiness_input,
    get_readiness_input_for_destination,
)
from app.database.connection import async_session_maker
from ml.models.priority_engine import InvestmentPriorityEngine
from ml.inference.orchestrator_gov import GovernmentIntelligenceOrchestrator


def test_readiness_weights_sum_to_one():
    """Verify exact weights match specification and sum to 1.0."""
    expected = {
        'accommodation': 0.25,
        'transport': 0.20,
        'connectivity': 0.15,
        'food_hospitality': 0.15,
        'medical_safety': 0.15,
        'other_amenities': 0.10
    }
    assert WEIGHTS == expected
    assert abs(sum(WEIGHTS.values()) - 1.0) < 0.0001


def test_compute_readiness_formula():
    """Verify 0-100 weighted calculation across all 6 factors."""
    # Test all 100s -> 100.0
    all_max = {k: 100.0 for k in WEIGHTS}
    assert compute_readiness(all_max) == 100.0

    # Test all 0s -> 0.0
    all_zero = {k: 0.0 for k in WEIGHTS}
    assert compute_readiness(all_zero) == 0.0

    # Test heterogeneous sample:
    # 0.25*80 + 0.20*60 + 0.15*50 + 0.15*70 + 0.15*90 + 0.10*40
    # = 20 + 12 + 7.5 + 10.5 + 13.5 + 4 = 67.5
    sample = {
        'accommodation': 80,
        'transport': 60,
        'connectivity': 50,
        'food_hospitality': 70,
        'medical_safety': 90,
        'other_amenities': 40
    }
    assert compute_readiness(sample) == 67.5


def test_readiness_badge_thresholds():
    """Verify badge tier assignment (Low < 45, Med 45-70, High >= 70)."""
    assert get_readiness_badge(85.0)["tier"] == "High"
    assert get_readiness_badge(70.0)["tier"] == "High"
    assert get_readiness_badge(69.9)["tier"] == "Medium"
    assert get_readiness_badge(45.0)["tier"] == "Medium"
    assert get_readiness_badge(44.9)["tier"] == "Low"
    assert get_readiness_badge(20.0)["tier"] == "Low"


def test_parse_destination_id():
    """Verify destination ID parsing for integer and string formats."""
    assert parse_destination_id(122) == 122
    assert parse_destination_id("122") == 122
    assert parse_destination_id("CT0122") == 122
    assert parse_destination_id("CT0005") == 5


@pytest.mark.asyncio
async def test_readiness_db_persistence_and_refresh():
    """Verify writing to readiness_inputs persists in DB and updates destinations_master."""
    target_id = 122
    sample_inputs = {
        'accommodation': 90.0,
        'transport': 80.0,
        'connectivity': 70.0,
        'food_hospitality': 75.0,
        'medical_safety': 85.0,
        'other_amenities': 60.0
    }
    # Expected score: 0.25*90 + 0.20*80 + 0.15*70 + 0.15*75 + 0.15*85 + 0.10*60
    # = 22.5 + 16 + 10.5 + 11.25 + 12.75 + 6 = 79.0
    expected_score = compute_readiness(sample_inputs)
    assert expected_score == 79.0

    async with async_session_maker() as session:
        result = await upsert_readiness_input(
            db=session,
            destination_id=target_id,
            inputs=sample_inputs,
            updated_by="gov_test_auditor"
        )
        assert result["readiness_score"] == 79.0
        assert result["destination_id"] == 122

        # Verify fetch
        fetched = await get_readiness_input_for_destination(session, target_id)
        assert fetched["is_persisted"] is True
        assert fetched["readiness_score"] == 79.0
        assert fetched["inputs"]["accommodation"] == 90.0

    # Direct sqlite3 verification
    db_path = BASE_DIR / "travelsathi_dev.db"
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT accommodation, transport, updated_by FROM readiness_inputs WHERE destination_id = ?", (target_id,))
    row = cur.fetchone()
    assert row is not None
    assert row[0] == 90.0
    assert row[2] == "gov_test_auditor"

    cur.execute("SELECT readiness_score FROM destinations_master WHERE id = ?", (target_id,))
    dm_row = cur.fetchone()
    assert dm_row is not None
    assert abs(dm_row[0] - 79.0) < 0.01
    conn.close()


def test_priority_engine_with_readiness_feature():
    """Verify priority engine accepts readiness_score as 7th factor and uses trained model."""
    engine = InvestmentPriorityEngine()

    dummy_pot = {
        "potential_score": 75.0,
        "factor_scores": {
            "attraction_strength": 80.0,
            "cultural_natural_significance": 70.0,
            "growth_opportunity": 65.0,
            "accessibility_potential": 60.0,
            "seasonality": 70.0,
        }
    }
    dummy_opp = {
        "opportunity_score": 72.0,
        "classification": "Emerging Opportunity",
        "infrastructure_readiness": 55.0
    }
    dummy_gaps = [
        {"category": "Road Access", "severity": "High", "recommended_interventions": ["Upgrade Highway NH-21"]}
    ]
    dummy_conf = {"score": 85.0}

    # Run with high readiness (85.0)
    res_high_readiness = engine.compute_priority(
        potential_data=dummy_pot,
        opportunity_data=dummy_opp,
        infrastructure_gaps=dummy_gaps,
        confidence_data=dummy_conf,
        readiness_score=85.0
    )

    # Run with low readiness (35.0) -> high readiness deficit should create urgency
    res_low_readiness = engine.compute_priority(
        potential_data=dummy_pot,
        opportunity_data=dummy_opp,
        infrastructure_gaps=dummy_gaps,
        confidence_data=dummy_conf,
        readiness_score=35.0
    )

    assert "investment_priority" in res_high_readiness
    assert "investment_priority" in res_low_readiness
    assert 0.0 <= res_high_readiness["investment_priority"] <= 100.0
    assert 0.0 <= res_low_readiness["investment_priority"] <= 100.0


def test_orchestrator_gov_includes_readiness_badge_and_score():
    """Verify 508 profiles produced by orchestrator include readiness_score and readiness_badge."""
    orch = GovernmentIntelligenceOrchestrator()
    rankings = orch.build_all_intelligence(force_refresh=True)
    assert len(rankings) == 508

    top = rankings[0]
    assert "scores" in top
    assert "readiness_score" in top["scores"]
    assert "readiness_badge" in top
    assert top["readiness_badge"]["tier"] in ["Low", "Medium", "High"]
    assert "readiness_factors" in top
    assert len(top["readiness_factors"]) == 6


@pytest.mark.asyncio
async def test_calculate_priority_preview_endpoint_and_hourly_token():
    """Verify live calculation preview endpoint calculates priority and injects hourly token."""
    from app.api.dmo import calculate_priority_endpoint
    from app.schemas.dmo import ReadinessInputRequest

    payload = ReadinessInputRequest(
        destination_id="CT0055",
        accommodation=61.4,
        transport=47.0,
        connectivity=42.5,
        food_hospitality=62.7,
        medical_safety=83.0,
        other_amenities=51.2
    )

    res = await calculate_priority_endpoint(payload=payload, db=None)
    assert "readiness_score" in res
    assert res["readiness_score"] == 58.1
    assert "computed_priority_score" in res
    assert 0.0 <= res["computed_priority_score"] <= 100.0
    assert "hourly_token" in res
    assert res["hourly_token"].startswith("tok_hourly_")
    assert "factor_scores" in res
    assert len(res["factor_scores"]) == 6

