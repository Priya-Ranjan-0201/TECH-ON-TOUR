"""
Master Health & Integrity Audit Test Suite for All Machine Learning Models in TravelSathi:
1. Model 1: Two-Stage Recommendation & Candidate Engagement Ranker (GradientBoostingClassifier)
2. Model 2: Dynamic Tariff & Revenue Optimization Regressor (GradientBoostingRegressor)
3. Model 3: Overtourism Saturation & Carrying Capacity Classifier (RandomForestClassifier)
4. Model 4: Co-Search Knowledge Graph Recommender (17,891 edges, 12,293 nodes)
5. Model 5: Review Sentiment Trust & Authentic Verification Layer
6. Model 6: Dynamic Eco-Permit Gatekeeper & Sustainable Diversion Engine
"""

import os
import joblib
import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.pricing_service import predict_price, get_pricing_model
from app.services.overtourism_service import predict_overtourism_risk, get_overtourism_model
from app.services.graph_recommender import graph_recommender
from app.services.review_service import ReviewService
from app.api.dmo import is_destination_permit_locked, get_permit_locked_alternative

client = TestClient(app)


# ============================================================================
# 1. MODEL 1: RECOMMENDATION RANKER (GRADIENT BOOSTING CLASSIFIER)
# ============================================================================

def test_recommendation_model_artifact_and_features():
    """Verify recommendation model file, class, and feature column alignment."""
    model_path = os.path.join(os.path.dirname(__file__), "..", "app", "services", "recommendation_model.pkl")
    assert os.path.exists(model_path), f"Recommendation model artifact missing at {model_path}"
    
    model = joblib.load(model_path)
    assert hasattr(model, "predict_proba"), "Recommendation model must implement predict_proba"
    assert hasattr(model, "feature_names_in_"), "Recommendation model must have feature_names_in_"
    
    expected_features = list(model.feature_names_in_)
    assert len(expected_features) >= 5, f"Expected at least 5 features, found {len(expected_features)}"

    # Test inference with exact named DataFrame to ensure zero warnings and valid probability
    sample_row = {
        "season_match": 1,
        "distance_km": 42.0,
        "category_match_score": 0.85,
        "user_affinity": 0.85,
        "past_interaction_count": 1,
        "global_popularity_30d": 350,
        "avg_rating": 4.7,
        "rating": 4.7,
    }
    input_df = pd.DataFrame([{col: sample_row.get(col, 0.0) for col in expected_features}], columns=expected_features)
    probs = model.predict_proba(input_df)
    
    assert probs.shape[0] == 1
    assert probs.shape[1] == 2
    assert 0.0 <= probs[0, 1] <= 1.0, f"Predicted probability {probs[0, 1]} out of bounds"


def test_recommendation_rails_ml_scoring_end_to_end():
    """Verify recommendation rails endpoint serves ML-ranked destinations with explanations."""
    response = client.get("/api/recommendations/rails?lat=28.6139&lng=77.2090&user_id=usr-901")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["rails"]) >= 5

    for rail in data["rails"]:
        for item in rail["items"]:
            assert "score" in item or "destination" in item
            if "score" in item:
                assert item["score"] > 0, "Destination score must be strictly positive"


# ============================================================================
# 2. MODEL 2: DYNAMIC PRICING REGRESSOR (GRADIENT BOOSTING REGRESSOR)
# ============================================================================

def test_pricing_model_artifact_and_predictions():
    """Verify pricing regressor loads, predicts accurate tariffs, and handles edge cases."""
    model, metadata = get_pricing_model()
    assert model is not None, "Pricing model must load successfully"
    assert hasattr(model, "predict"), "Pricing model must implement predict"
    
    # 1. Standard prediction
    res = predict_price(
        base_price=3500.0,
        days_to_festival=8,
        is_weekend=1,
        season_demand_index=0.88,
        occupancy_rate_last_30d=0.78,
        category_luxury_tier=2,
        review_rating=4.9
    )
    assert res["model_used"] is True
    assert res["suggested_price"] > 3500.0, "High season weekend with festival should increase price"
    assert res["delta_percentage"] > 0
    assert "metrics" in res
    assert res["metrics"]["r2_score"] >= 0.95

    # 2. Defensive Edge Cases (clamping out-of-bounds inputs)
    res_edge = predict_price(
        base_price=200.0,      # Below minimum, should clamp to >= 500
        days_to_festival=999,  # Clamped to 60
        is_weekend=0,
        season_demand_index=2.5, # Clamped to 1.0
        occupancy_rate_last_30d=-0.5, # Clamped to 0.0
        category_luxury_tier=10, # Clamped to 3
        review_rating=6.5      # Clamped to 5.0
    )
    assert res_edge["suggested_price"] >= 500.0
    assert res_edge["model_used"] is True


def test_pricing_api_endpoint():
    """Verify dynamic pricing API endpoint."""
    payload = {
        "base_price": 2800.0,
        "days_to_festival": 10,
        "is_weekend": 1,
        "season_demand_index": 0.85,
        "occupancy_rate_last_30d": 0.70,
        "category_luxury_tier": 2,
        "review_rating": 4.8
    }
    resp = client.post("/api/homestays/dynamic-price", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["model_used"] is True
    assert data["suggested_price"] > 2800.0
    assert "confidence_score" in data


# ============================================================================
# 3. MODEL 3: OVERTOURISM SATURATION RISK CLASSIFIER (RANDOM FOREST)
# ============================================================================

def test_overtourism_model_artifact_and_classification():
    """Verify overtourism model artifact, class mapping, and probability thresholds."""
    model, metadata = get_overtourism_model()
    assert model is not None, "Overtourism model must load successfully"

    # Case A: Severe overtourism hotspot (>15,000 reviews)
    res_hotspot = predict_overtourism_risk(
        review_count=32000,
        rating=4.5,
        latitude=32.2396,
        longitude=77.1887,
        category="attraction"
    )
    assert res_hotspot["model_used"] is True
    assert res_hotspot["saturation_class"] == 2, "Expected Class 2 (Saturated)"
    assert res_hotspot["status"] == "CRITICAL"
    assert res_hotspot["saturation_risk_pct"] >= 75.0
    assert "advisory" in res_hotspot

    # Case B: Peaceful hidden gem (<1,000 reviews, high rating)
    res_gem = predict_overtourism_risk(
        review_count=450,
        rating=4.8,
        latitude=31.6395,
        longitude=77.4459,
        category="attraction"
    )
    assert res_gem["model_used"] is True
    assert res_gem["saturation_class"] == 0, "Expected Class 0 (Peaceful Hidden Gem)"
    assert res_gem["status"] == "SUSTAINABLE"
    assert res_gem["probabilities"]["peaceful"] > res_gem["probabilities"]["saturated"]


def test_overtourism_api_endpoints():
    """Verify GET and POST endpoints for overtourism risk prediction."""
    # GET
    resp_get = client.get("/api/anti-overtourism/predict-risk?review_count=25000&rating=4.6&latitude=32.2&longitude=77.1")
    assert resp_get.status_code == 200
    data_get = resp_get.json()
    assert data_get["model_used"] is True
    assert data_get["status"] == "CRITICAL"

    # POST
    payload = {"review_count": 300, "rating": 4.9, "latitude": 19.1, "longitude": 81.9, "category": "nature"}
    resp_post = client.post("/api/anti-overtourism/predict-risk", json=payload)
    assert resp_post.status_code == 200
    data_post = resp_post.json()
    assert data_post["model_used"] is True
    assert data_post["status"] == "SUSTAINABLE"


# ============================================================================
# 4. MODEL 4: CO-SEARCH KNOWLEDGE GRAPH RECOMMENDER
# ============================================================================

def test_knowledge_graph_recommender_coverage():
    """Verify that the co-search bipartite graph is fully indexed."""
    stats = graph_recommender.get_stats()
    assert stats["status"] == "ready"
    assert stats["total_destinations"] == 12293
    assert stats["total_graph_edges"] == 17891
    assert stats["unique_search_terms"] >= 10000

    # Search for known term
    results = graph_recommender.search_by_term("temple", limit=4)
    assert len(results) > 0
    assert "associated_terms" in results[0]

    # Empty search fallback
    empty_results = graph_recommender.search_by_term("", limit=5)
    assert empty_results == []


# ============================================================================
# 5. MODEL 5: REVIEW SENTIMENT TRUST LAYER
# ============================================================================

def test_review_sentiment_and_authenticity():
    """Verify review sentiment classification and trust scoring."""
    service = ReviewService()
    
    # Positive review
    pos_res = service.classify_sentiment("The Sheesh Mahal mirror work was breathtaking, authentic, and pristine heritage!")
    assert pos_res["score"] >= 0.75
    assert pos_res["label"] == "POSITIVE"

    # Negative review
    neg_res = service.classify_sentiment("Dirty rooms, unhygienic washrooms, and completely overpriced scam.")
    assert neg_res["score"] <= 0.40
    assert neg_res["label"] == "NEGATIVE"

    # Authenticity Trust Score (Verified booking + detailed review)
    trust_high = service.compute_authenticity_score(
        review_text="Detailed review of our 3-day guided cultural tour of Hampi temples with authentic coracle crossing.",
        is_verified_booking=True
    )
    assert trust_high >= 80

    # Spam review
    trust_spam = service.compute_authenticity_score(
        review_text="Free money click here http://spam.xyz discount code crypto",
        is_verified_booking=False
    )
    assert trust_spam <= 35


# ============================================================================
# 6. MODEL 6: DYNAMIC ECO-PERMIT GATEKEEPER
# ============================================================================

def test_eco_permit_gatekeeper_diversion():
    """Verify dynamic eco-permit lock and alternative circuit mapping."""
    alt = get_permit_locked_alternative("Manali")
    assert alt is not None
    assert alt["alternative"] == "Tirthan Valley & Jibhi"
    assert alt["crowd_reduction_pct"] >= 60

    # Toggle lock on via API
    toggle_resp = client.post("/api/dmo/eco-permit/toggle", json={"destination": "Manali", "state": "Himachal Pradesh", "is_locked": True})
    assert toggle_resp.status_code == 200
    assert toggle_resp.json()["is_locked"] is True
    assert is_destination_permit_locked("Manali") is True

    # Check status endpoint
    status_resp = client.get("/api/dmo/eco-permit/check/Manali")
    assert status_resp.status_code == 200
    assert status_resp.json()["is_locked"] is True
    assert status_resp.json()["advisory"] is not None

    # Unlock for idempotency
    client.post("/api/dmo/eco-permit/toggle", json={"destination": "Manali", "state": "Himachal Pradesh", "is_locked": False})
    assert is_destination_permit_locked("Manali") is False
