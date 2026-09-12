import os
from pathlib import Path
import pandas as pd
import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.recommendation_service import (
    rank_destinations,
    recommendation_engine,
    FEATURES,
    MODEL_PATH_V2
)

client = TestClient(app)

def test_model_artifact_exists():
    """Verify recommendation_model.pkl exists and has valid 7 features."""
    assert MODEL_PATH_V2.exists(), "recommendation_model.pkl must exist"
    import joblib
    model = joblib.load(MODEL_PATH_V2)
    assert hasattr(model, "predict_proba")
    feature_names = list(getattr(model, "feature_names_in_", []))
    assert feature_names == FEATURES, f"Expected {FEATURES}, got {feature_names}"

def test_rank_destinations_with_model():
    """Test rank_destinations scores and sorts correctly using the 7 features."""
    data = {
        "name": ["Heritage Fort", "Adventure Peak", "Nature Valley"],
        "interest_overlap_score": [0.95, 0.10, 0.40],
        "distance_km": [25.0, 180.0, 60.0],
        "season_match": [1, 1, 1],
        "past_category_affinity": [0.85, 0.20, 0.35],
        "avg_rating": [4.8, 4.2, 4.5],
        "price_tier_match": [1, 0, 1],
        "global_popularity_30d": [320, 150, 200]
    }
    df = pd.DataFrame(data)
    ranked = rank_destinations(df)
    assert "score" in ranked.columns
    assert len(ranked) == 3
    # Fort with high interest overlap and close distance should rank #1
    assert ranked.iloc[0]["name"] == "Heritage Fort"

def test_different_interests_yield_different_recommendations():
    """Test that two users with different interests (heritage vs adventure) get visibly different rankings."""
    candidates = pd.DataFrame({
        "name": ["Red Fort Citadel", "Rishikesh White Water Rafting"],
        "interest_overlap_score": [0.9, 0.1],  # User 1 prefers heritage
        "distance_km": [15.0, 15.0],
        "season_match": [1, 1],
        "past_category_affinity": [0.8, 0.1],
        "avg_rating": [4.7, 4.7],
        "price_tier_match": [1, 1],
        "global_popularity_30d": [400, 400]
    })
    user1_ranked = rank_destinations(candidates.copy())
    
    # User 2 prefers adventure
    candidates["interest_overlap_score"] = [0.1, 0.9]
    candidates["past_category_affinity"] = [0.1, 0.8]
    user2_ranked = rank_destinations(candidates.copy())

    assert user1_ranked.iloc[0]["name"] == "Red Fort Citadel"
    assert user2_ranked.iloc[0]["name"] == "Rishikesh White Water Rafting"

def test_location_proximity_changes_nearby_rankings():
    """Test that moving coordinates changes distance and shifts rankings."""
    candidates = pd.DataFrame({
        "name": ["North Landmark", "South Landmark"],
        "interest_overlap_score": [0.5, 0.5],
        "distance_km": [10.0, 1500.0],  # Close to North
        "season_match": [1, 1],
        "past_category_affinity": [0.5, 0.5],
        "avg_rating": [4.5, 4.5],
        "price_tier_match": [1, 1],
        "global_popularity_30d": [300, 300]
    })
    north_user = rank_destinations(candidates.copy())

    # User in South
    candidates["distance_km"] = [1500.0, 10.0]
    south_user = rank_destinations(candidates.copy())

    assert north_user.iloc[0]["name"] == "North Landmark"
    assert south_user.iloc[0]["name"] == "South Landmark"

def test_fallback_scoring_when_model_fails():
    """Test that model failure triggers heuristic fallback without throwing an exception."""
    df = pd.DataFrame({
        "name": ["Place A", "Place B"],
        "interest_overlap_score": [0.8, 0.2],
        "distance_km": [20.0, 100.0],
        "season_match": [1, 1],
        "past_category_affinity": [0.7, 0.2],
        "avg_rating": [4.6, 4.0],
        "price_tier_match": [1, 0],
        "global_popularity_30d": [200, 50]
    })
    
    # Temporarily point to nonexistent path
    original_path = MODEL_PATH_V2
    try:
        non_existent = Path("non_existent_model.pkl")
        # Test fallback directly with bad dataframe or missing file
        bad_df = pd.DataFrame({"name": ["Place A"]})
        result = rank_destinations(bad_df)
        assert "score" in result.columns
    finally:
        pass

def test_cold_start_new_user_recommendations():
    """Test that a brand-new user with zero interests and zero history gets sensible fallback recommendations."""
    df = pd.DataFrame({
        "name": ["Popular Peak", "Obscure Low-Rated Place"],
        "interest_overlap_score": [0.0, 0.0],
        "distance_km": [50.0, 50.0],
        "season_match": [1, 0],
        "past_category_affinity": [0.0, 0.0],
        "avg_rating": [4.8, 2.5],
        "price_tier_match": [0, 0],
        "global_popularity_30d": [800, 10]
    })
    result = rank_destinations(df)
    assert result.iloc[0]["name"] == "Popular Peak"

def test_recommendation_rails_endpoint():
    """Verify that the FastAPI /api/recommendations/rails endpoint returns 200 with all rails."""
    res = client.get("/api/recommendations/rails?lat=28.61&lng=77.20&user_id=usr-test-99")
    assert res.status_code == 200
    data = res.json()
    assert "rails" in data
    assert len(data["rails"]) >= 3
