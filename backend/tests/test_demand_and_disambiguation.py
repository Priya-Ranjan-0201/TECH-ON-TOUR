import os
import re
import pandas as pd
import pytest
from ml.features.feature_pipeline import get_feature_pipeline
from ml.models.tourism_potential import TourismPotentialModel
from ml.inference.orchestrator_gov import GovernmentIntelligenceOrchestrator
from app.services.govt_intelligence_service import get_current_hourly_token


def test_city_demand_dataset_completeness():
    csv_path = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "data", "government_sources", "city_demand_scored.csv")
    assert os.path.exists(csv_path), "city_demand_scored.csv must exist"
    df = pd.read_csv(csv_path)
    assert len(df) == 508, f"Expected 508 cities, got {len(df)}"
    assert "composite_demand_score" in df.columns
    assert df["composite_demand_score"].isnull().sum() == 0, "All 508 cities must have scored composite_demand_score"
    assert (df["composite_demand_score"] >= 0).all() and (df["composite_demand_score"] <= 100).all()


def test_potential_model_with_real_demand():
    model = TourismPotentialModel()
    res = model.compute_potential(
        attraction_strength=70.0,
        cultural_natural_significance=60.0,
        growth_opportunity=80.0,
        accessibility_potential=50.0,
        seasonality=75.0,
        tourism_demand=65.0
    )
    assert res["demand_status"] == "verified"
    assert res["factor_scores"]["tourism_demand"] == 65.0
    # Formula check: 0.30*70 + 0.20*65 + 0.15*60 + 0.15*80 + 0.10*50 + 0.10*75
    # = 21 + 13 + 9 + 12 + 5 + 7.5 = 67.5
    assert res["potential_score"] == 67.5


def test_orchestrator_all_profiles_have_demand():
    orch = GovernmentIntelligenceOrchestrator()
    profiles = orch.build_all_intelligence(force_refresh=True)
    assert len(profiles) == 508

    for p in profiles:
        f_scores = p["factor_scores"]
        assert f_scores["tourism_demand"] is not None
        assert 0.0 <= f_scores["tourism_demand"] <= 100.0


def test_city_district_disambiguation():
    orch = GovernmentIntelligenceOrchestrator()
    profiles = orch.build_all_intelligence()

    # Verify Samastipur & Pusa are distinct
    samastipur_entries = [p for p in profiles if p["district"].lower() == "samastipur"]
    assert len(samastipur_entries) == 2
    cities = {p["city"].lower() for p in samastipur_entries}
    assert "pusa" in cities
    assert "samastipur" in cities
    dest_ids = {p["destination_id"] for p in samastipur_entries}
    assert len(dest_ids) == 2


def test_hourly_token_pattern():
    tok = get_current_hourly_token()
    assert re.match(r"^tok_hourly_\d{8}_\d{2}00$", tok)
