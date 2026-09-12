"""
backend/tests/test_7_specialized_models.py
------------------------------------------
Comprehensive test suite validating:
- Zero-latency in-memory loading of all 7 specialized ML models
- Sub-scores, classification, regression, and ranking outputs for Models 1-7
- Diversity constraint filtering and explainable AI reason generation
- Cold start handling with onboarding profiles
- All 8 REST API contracts under /api
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from ml.inference.model_loaders import registry
from ml.inference.orchestrator import orchestrator

client = TestClient(app)

# -------------------------------------------------------------
# Test 1: Registry & Artifact Initialization
# -------------------------------------------------------------

def test_model_registry_initialization():
    registry.load_all()
    assert registry.is_loaded is True
    assert registry.m1_destination is not None
    assert registry.m2_weather is not None
    assert registry.m3_nearby is not None
    assert registry.m4_preference is not None
    assert registry.m5_trending is not None
    assert registry.m6_demand_reg is not None
    assert registry.m6_demand_clf is not None
    assert registry.m7_similarity_bundle is not None
    assert len(registry.dest_lookup) > 1000

# -------------------------------------------------------------
# Test 2: Model 1 - Destination Recommender (LTR)
# -------------------------------------------------------------

def test_model_1_destination_recommender():
    sample_cand = next(iter(registry.dest_lookup.values()))
    profile = {
        "travel_style": "nature",
        "budget": "budget",
        "preferred_activities": "trekking, nature"
    }
    scores = orchestrator._batch_score_m1([sample_cand], profile)
    assert len(scores) == 1
    score = scores[0]
    assert 0.0 <= score <= 1.0

# -------------------------------------------------------------
# Test 3: Model 2 - Season & Weather Suitability
# -------------------------------------------------------------

def test_model_2_season_weather():
    sample_cand = next(iter(registry.dest_lookup.values()))
    ctx = {
        "month": 9,
        "temperature": 24.0,
        "humidity": 60.0,
        "rainfall": 15.0,
        "wind_speed": 10.0,
        "weather_alert": 0
    }
    res = orchestrator._batch_score_m2([sample_cand], ctx)[0]
    assert "suitability_score" in res
    assert 0.0 <= res["suitability_score"] <= 1.0
    assert res["classification"] in ["Excellent", "Good", "Moderate", "Poor", "Not Recommended"]
    assert "confidence" in res

# -------------------------------------------------------------
# Test 4: Model 3 - Nearby Place Ranker
# -------------------------------------------------------------

def test_model_3_nearby_ranker():
    sample_cand = next(iter(registry.dest_lookup.values()))
    ctx = {"user_lat": 28.6139, "user_lon": 77.2090}
    score = orchestrator._score_m3_nearby(sample_cand, ctx)
    assert 0.0 <= score <= 1.0

# -------------------------------------------------------------
# Test 5: Model 4 - Personal Preference Latent Model
# -------------------------------------------------------------

def test_model_4_personal_preference():
    sample_cand = next(iter(registry.dest_lookup.values()))
    profile = {"travel_style": "heritage"}
    score = orchestrator._score_m4_preference(sample_cand, profile, user_id=None)
    assert 0.0 <= score <= 1.0

# -------------------------------------------------------------
# Test 6: Model 5 - Popularity & Trending Model
# -------------------------------------------------------------

def test_model_5_trending():
    sample_cand = next(iter(registry.dest_lookup.values()))
    res = orchestrator._batch_score_m5([sample_cand])[0]
    assert "trend_score" in res
    assert "growth_rate" in res
    assert res["trend_status"] in ["Rising", "Consistently Popular", "Steady", "Declining"]

# -------------------------------------------------------------
# Test 7: Model 6 - Travel Demand & Crowdedness
# -------------------------------------------------------------

def test_model_6_demand_crowd():
    sample_cand = next(iter(registry.dest_lookup.values()))
    ctx = {"month": 10, "day_of_week": 6, "is_weekend": 1, "is_holiday": 0}
    res = orchestrator._batch_score_m6([sample_cand], ctx)[0]
    assert "demand_score" in res
    assert res["crowd_level"] in ["Low", "Moderate", "High", "Very High"]

# -------------------------------------------------------------
# Test 8: Model 7 - Destination Similarity
# -------------------------------------------------------------

def test_model_7_similarity():
    sample_cand = next(iter(registry.dest_lookup.values()))
    anchor_id = sample_cand["destination_id"]
    sim = orchestrator._score_m7_similarity(sample_cand, anchor_id=anchor_id, profile={})
    assert 0.0 <= sim <= 1.0

# -------------------------------------------------------------
# Test 9: Central Multi-Model Pipeline & Diversity Constraints
# -------------------------------------------------------------

def test_central_pipeline_with_diversity():
    profile = {
        "budget": "mid",
        "travel_style": "nature",
        "preferred_activities": "trekking, sightseeing"
    }
    recs = orchestrator.recommend(user_profile=profile, top_k=6)
    assert len(recs) == 6

    # Verify schema of each recommendation
    for item in recs:
        assert "destination_id" in item
        assert "name" in item
        assert "final_score" in item
        assert "confidence" in item
        assert "model_scores" in item
        assert "recommendation_reasons" in item
        assert len(item["recommendation_reasons"]) >= 1

    # Verify Diversity Filter: max 2 per state in top 6
    state_counts = {}
    for item in recs:
        s = item["state"]
        state_counts[s] = state_counts.get(s, 0) + 1
    assert max(state_counts.values()) <= 2

# -------------------------------------------------------------
# Test 10: API Endpoint Integration (All 8 REST Endpoints)
# -------------------------------------------------------------

def test_api_recommendations_endpoint():
    response = client.get("/api/recommendations?travel_style=adventure&budget=budget&top_k=5")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["recommendations"]) == 5
    assert "model_scores" in data["recommendations"][0]

def test_api_seasonal_endpoint():
    response = client.get("/api/recommendations/seasonal?month=10&temperature=22.0")
    assert response.status_code == 200
    data = response.json()
    assert "suitability_score" in data
    assert "classification" in data

def test_api_nearby_endpoint():
    response = client.get("/api/recommendations/nearby?lat=28.6139&lon=77.2090&top_k=4")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["results"]) == 4
    assert "distance_km" in data["results"][0]

def test_api_similar_endpoint():
    sample_id = next(iter(registry.dest_lookup.keys()))
    response = client.get(f"/api/recommendations/similar?destination_id={sample_id}&top_k=3")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["similar_destinations"]) <= 3

def test_api_trending_endpoint():
    response = client.get("/api/trending?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["results"]) == 5
    assert "trend_status" in data["results"][0]

def test_api_demand_endpoint():
    sample_id = next(iter(registry.dest_lookup.keys()))
    response = client.get(f"/api/demand?destination_id={sample_id}&month=11")
    assert response.status_code == 200
    data = response.json()
    assert "demand_score" in data
    assert "crowd_level" in data

def test_api_feedback_endpoint():
    payload = {
        "user_id": "test_user_ml",
        "destination_id": 1,
        "event_type": "save",
        "duration_seconds": 45,
        "rating": 5.0
    }
    response = client.post("/api/feedback", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "feedback_logged"
    assert data["assigned_weight"] == 4.0

def test_api_user_preferences_endpoint():
    payload = {
        "user_id": "test_user_onboard",
        "age_group": "25-34",
        "budget": "budget",
        "travel_style": "adventure",
        "preferred_categories": "adventure, mountains",
        "trip_duration_days": 5
    }
    response = client.post("/api/user/preferences", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "preferences_saved"
