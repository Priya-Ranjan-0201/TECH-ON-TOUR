import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.pricing_service import predict_price, PricingService

client = TestClient(app)

def test_dynamic_pricing_service_direct():
    res = predict_price(
        base_price=2000.0,
        days_to_festival=7,
        is_weekend=1,
        season_demand_index=0.8,
        occupancy_rate_last_30d=0.7,
        category_luxury_tier=2,
        review_rating=4.8
    )
    assert res["suggested_price"] > 0
    assert res["confidence_score"] > 0
    assert isinstance(res["reasoning"], str)
    assert len(res["factors"]) > 0

def test_pricing_service_class_wrapper():
    rec = PricingService.get_pricing_recommendation(
        state="Himachal Pradesh",
        base_tariff_inr=2500.0,
        days_to_festival=12,
        is_weekend=True
    )
    assert rec["recommended_tariff_inr"] > 0
    assert "GradientBoostingRegressor" in rec["algorithm_info"]

def test_dynamic_pricing_endpoint_post():
    payload = {
        "base_price": 2500.0,
        "days_to_festival": 5,
        "is_weekend": 1,
        "season_demand_index": 0.85,
        "occupancy_rate_last_30d": 0.75,
        "category_luxury_tier": 2,
        "review_rating": 4.9
    }
    response = client.post("/api/homestays/dynamic-price", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "suggested_price" in data
    assert "confidence_score" in data
    assert "model_used" in data
    assert data["model_used"] is True
    assert "GradientBoostingRegressor" in data["model_name"]
    assert data["suggested_price"] > data["base_price"]

def test_host_dashboard_pricing_suggestion():
    response = client.get("/api/homestays/host/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "pricing_suggestion" in data
    assert data["pricing_suggestion"]["model_used"] is True
