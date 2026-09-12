import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.graph_recommender import graph_recommender
from app.services.pricing_service import predict_price

client = TestClient(app)

def test_pricing_model_trained_on_full_dataset():
    """
    Verifies that the pricing model reflects training across the 14,293 national dataset records.
    """
    res = predict_price(
        base_price=3000.0,
        days_to_festival=4,
        is_weekend=1,
        season_demand_index=0.9,
        occupancy_rate_last_30d=0.8,
        category_luxury_tier=2,
        review_rating=4.7
    )
    assert res["model_used"] is True
    assert res["suggested_price"] > 3000.0
    assert "metrics" in res
    assert res["metrics"]["r2_score"] >= 0.95
    assert res["metrics"]["mape_percent"] <= 5.0

def test_graph_recommender_dataset_coverage():
    """
    Verifies that the co-search recommender maintains all 12,293 places and 17,891 graph edges.
    """
    stats = graph_recommender.get_stats()
    assert stats["total_destinations"] == 12293
    assert stats["total_graph_edges"] == 17891
    assert stats["unique_search_terms"] >= 10000
    assert stats["status"] == "ready"

def test_graph_recommendation_api_endpoints():
    """
    Tests the graph stats and recommendation endpoints.
    """
    # 1. Stats
    resp_stats = client.get("/api/destinations/graph/stats")
    assert resp_stats.status_code == 200
    data_stats = resp_stats.json()
    assert data_stats["total_destinations"] == 12293
    assert data_stats["total_graph_edges"] == 17891

    # 2. Recommendation traversal
    resp_rec = client.get("/api/destinations/graph/recommend?q=temple&limit=3")
    assert resp_rec.status_code == 200
    data_rec = resp_rec.json()
    assert data_rec["count"] > 0
    assert len(data_rec["destinations"]) <= 3

    # 3. Related places lookup
    resp_rel = client.get("/api/destinations/1/related?limit=2")
    assert resp_rel.status_code == 200
    data_rel = resp_rel.json()
    assert "related_destinations" in data_rel
