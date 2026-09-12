"""
test_all_3_ml_models.py
Comprehensive test suite for the 3 Machine Learning Models of TravelSathi:
1. Dynamic Pricing Model (Regression - GradientBoostingRegressor)
2. Recommendation Ranking Model (Classification - GradientBoostingClassifier)
3. Review Authenticity / Sentiment Model (Classification - LogisticRegression)
"""

import os
import json
import pytest
import joblib
from fastapi.testclient import TestClient

from app.main import app
from app.services.pricing_service import predict_price, reload_model, get_pricing_model
from app.services.review_service import ReviewService, get_review_authenticity_model

client = TestClient(app)

SERVICES_DIR = os.path.join(os.path.dirname(__file__), "..", "app", "services")


# ============================================================================
# 1. DYNAMIC PRICING MODEL TESTS
# ============================================================================

def test_pricing_model_artifacts_exist():
    model_path = os.path.join(SERVICES_DIR, "pricing_model.pkl")
    meta_path = os.path.join(SERVICES_DIR, "pricing_model_metadata.json")
    assert os.path.exists(model_path), f"Pricing model artifact missing at {model_path}"
    assert os.path.exists(meta_path), f"Pricing metadata missing at {meta_path}"

    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)
    assert meta["model_name"] == "Dynamic Pricing Model"
    assert "metrics" in meta
    assert meta["metrics"]["test_mae_inr"] > 0
    assert meta["metrics"]["test_r2_score"] > 0.90


def test_pricing_model_ml_serving():
    result = predict_price(
        base_price=3000.0,
        days_to_festival=5,
        is_weekend=1,
        season_demand_index=0.85,
        occupancy_rate_last_30d=0.75,
        category_luxury_tier=2,
        review_rating=4.8
    )
    assert result["model_used"] is True
    assert result["serving_path"] == "ml_model"
    assert "recommended_price" in result
    assert result["recommended_price"] > 3000.0  # Festival + weekend + high occupancy surge
    assert result["confidence_score"] > 0.90


def test_pricing_model_rule_fallback(monkeypatch):
    # Simulate model loading failure to test strict rule fallback
    import app.services.pricing_service as ps
    monkeypatch.setattr(ps, "get_pricing_model", lambda: (None, None))

    # Weekend fallback: base_price * 1.15
    res_weekend = ps.predict_price(base_price=2000.0, is_weekend=1)
    assert res_weekend["model_used"] is False
    assert res_weekend["serving_path"] == "rule_fallback"
    assert res_weekend["recommended_price"] == 2300.0  # 2000 * 1.15

    # Weekday fallback: base_price * 1.0
    res_weekday = ps.predict_price(base_price=2000.0, is_weekend=0)
    assert res_weekday["model_used"] is False
    assert res_weekday["serving_path"] == "rule_fallback"
    assert res_weekday["recommended_price"] == 2000.0


# ============================================================================
# 2. RECOMMENDATION RANKING MODEL TESTS
# ============================================================================

def test_recommendation_model_artifacts_exist():
    model_path = os.path.join(SERVICES_DIR, "recommendation_model.pkl")
    meta_path = os.path.join(SERVICES_DIR, "recommendation_model_metadata.json")
    assert os.path.exists(model_path), f"Recommendation model artifact missing at {model_path}"
    assert os.path.exists(meta_path), f"Recommendation metadata missing at {meta_path}"

    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)
    assert meta["model_name"] == "Recommendation Ranking Model"
    assert meta["metrics"]["roc_auc"] >= 0.70
    assert meta["metrics"]["accuracy"] >= 0.65
    assert "confusion_matrix" in meta["metrics"]


def test_recommendation_model_7_features_prediction():
    import pandas as pd
    model_path = os.path.join(SERVICES_DIR, "recommendation_model.pkl")
    model = joblib.load(model_path)

    sample_features = pd.DataFrame([{
        "interest_overlap_score": 0.85,
        "distance_km": 45.0,
        "season_match": 1,
        "past_category_affinity": 0.70,
        "avg_rating": 4.8,
        "price_tier_match": 1,
        "global_popularity_30d": 250
    }])
    prob = float(model.predict_proba(sample_features)[0, 1])
    assert 0.0 <= prob <= 1.0
    # High interest overlap + proximity + rating should have a healthy conversion likelihood
    assert prob > 0.40


def test_recommendation_cold_start_policy():
    import pandas as pd
    model_path = os.path.join(SERVICES_DIR, "recommendation_model.pkl")
    model = joblib.load(model_path)

    # Brand-new user: 0 past affinity, 0 interest overlap
    cold_features = pd.DataFrame([{
        "interest_overlap_score": 0.0,
        "distance_km": 120.0,
        "season_match": 1,
        "past_category_affinity": 0.0,
        "avg_rating": 4.7,
        "price_tier_match": 1,
        "global_popularity_30d": 300
    }])
    prob = float(model.predict_proba(cold_features)[0, 1])
    assert 0.0 <= prob <= 1.0


# ============================================================================
# 3. REVIEW AUTHENTICITY / SENTIMENT MODEL TESTS
# ============================================================================

def test_review_authenticity_artifacts_exist():
    model_path = os.path.join(SERVICES_DIR, "review_authenticity_model.pkl")
    meta_path = os.path.join(SERVICES_DIR, "review_authenticity_metadata.json")
    assert os.path.exists(model_path), f"Review authenticity model missing at {model_path}"
    assert os.path.exists(meta_path), f"Review authenticity metadata missing at {meta_path}"

    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)
    assert meta["model_name"] == "Review Authenticity / Sentiment Classifier"
    assert meta["metrics"]["cv_accuracy"] >= 0.75
    assert meta["metrics"]["cv_precision"] >= 0.80


def test_review_feature_extraction():
    text = "Room 204 had a brilliant view of Kanchenjunga. Guide Ramesh was extremely helpful."
    feats = ReviewService.extract_authenticity_features(text, rating=4.8)
    assert feats["review_length"] > 10
    assert feats["exclamation_mark_count"] == 0
    assert feats["specificity_score"] >= 1.0  # Room 204, Ramesh, Kanchenjunga
    assert 0.0 <= feats["pretrained_sentiment_score"] <= 1.0


def test_genuine_review_prediction():
    text = "Amber Fort Sheesh Mahal mirror work was mesmerizing. Guide Ramesh explained the acoustic resonance of the royal courtyard."
    result = ReviewService.predict_authenticity(text, rating=4.9)
    assert result["model_used"] is True
    assert result["is_genuine"] is True
    assert result["has_badge"] is True
    assert result["authenticity_label"] == "LIKELY_GENUINE"
    assert result["confidence_score"] >= 0.50


def test_generic_and_spam_review_prediction():
    generic_text = "Great place! Highly recommend to everyone. Best hotel ever! Five stars! Superb hospitality!"
    result = ReviewService.predict_authenticity(generic_text, rating=5.0)
    assert result["model_used"] is True
    # Generic marketing clichés and lack of specificity should be flagged
    assert result["is_genuine"] is False
    assert result["has_badge"] is False
    assert result["authenticity_label"] == "GENERIC_OR_SUSPICIOUS"


def test_mismatched_review_prediction():
    # 5-star rating but horrible complaint text
    mismatch_text = "Terrible hotel, noisy road, broken furniture, leaking AC and unhygienic kitchen."
    result = ReviewService.predict_authenticity(mismatch_text, rating=5.0)
    assert result["is_genuine"] is False
    assert result["has_badge"] is False


def test_review_authenticity_honest_fallback(monkeypatch):
    import app.services.review_service as rs
    monkeypatch.setattr(rs, "get_review_authenticity_model", lambda: (None, None))

    result = rs.ReviewService.predict_authenticity("Some review text", rating=4.5)
    # The prompt explicitly requires: show no authenticity badge at all rather than guessing
    assert result["model_used"] is False
    assert result["has_badge"] is False
    assert result["authenticity_label"] is None
    assert result["serving_path"] == "honest_absent_fallback"


def test_review_authenticity_api_endpoint():
    response = client.post(
        "/api/reviews/predict-authenticity",
        json={
            "review_text": "PM-JUGA tribal eco-nest in Bastar was tranquil. Sukru showed us traditional Dhokra bell-metal casting.",
            "rating": 4.9
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "has_badge" in data
    assert "authenticity_label" in data
    assert "confidence_score" in data
    assert data["has_badge"] is True
