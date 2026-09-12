import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_destinations_pagination():
    response = client.get("/api/destinations?page=1&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 80
    assert data["page"] == 1
    assert data["limit"] == 10
    assert len(data["results"]) == 10
    assert data["total_pages"] >= 8


def test_filter_destinations_by_state():
    response = client.get("/api/destinations?state=Kerala&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    assert len(data["results"]) <= 5
    for item in data["results"]:
        assert item["state"].lower() == "kerala"


def test_filter_destinations_by_category():
    response = client.get("/api/destinations?category=attraction&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    for item in data["results"]:
        assert item["category"].lower() == "attraction"


def test_search_destinations():
    response = client.get("/api/destinations?search=Fort&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    assert any("fort" in item["name"].lower() or "fort" in item["description"].lower() for item in data["results"])


def test_states_list_endpoint():
    response = client.get("/api/destinations/states")
    assert response.status_code == 200
    data = response.json()
    assert data["total_states"] >= 30
    assert len(data["states"]) == data["total_states"]
    # Verify state item structure
    first_state = data["states"][0]
    assert "state" in first_state
    assert "destination_count" in first_state
    assert first_state["destination_count"] > 0


def test_get_destination_detail_and_reviews():
    response = client.get("/api/destinations/1")
    assert response.status_code == 200
    data = response.json()
    assert "destination" in data
    assert data["destination"]["id"] == 1
    assert "name" in data["destination"]
    assert "verified_reviews" in data
    # Destination 1 has seeded reviews
    assert len(data["verified_reviews"]) >= 1
    review = data["verified_reviews"][0]
    assert "sentiment_score" in review
    assert "authenticity_score" in review
    assert review["authenticity_score"] >= 90


def test_destination_not_found():
    response = client.get("/api/destinations/99999999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_nearby_destinations_api():
    # Tirupati coordinates: 13.6288, 79.4192
    response = client.get("/api/destinations/nearby?lat=13.6288&lon=79.4192&radius_km=30&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] > 0
    assert len(data["places"]) <= 10
    # Places must have distance_km
    for place in data["places"]:
        assert "distance_km" in place
        assert place["distance_km"] <= 30.0


def test_list_homestays():
    response = client.get("/api/homestays")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 5
    first = data["results"][0]
    assert "title" in first
    assert "base_price_inr" in first
    assert "sanitation_trust_score" in first


def test_tribal_homestays_filter():
    response = client.get("/api/homestays?tribal_only=true")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 5
    for h in data["results"]:
        assert h["is_tribal_pmjuga"] is True
        assert h["sanitation_trust_score"] >= 80


def test_anti_overtourism_circuits():
    response = client.get("/api/anti-overtourism/alternatives?popular_destination=Manali")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 1
    circuit = data["circuits"][0]
    assert "Manali" in circuit["popular_name"]
    assert circuit["alternative_name"] == "Tirthan Valley"
    assert circuit["crowd_reduction_pct"] == 65


def test_weather_endpoint():
    response = client.get("/api/weather?destination=Manali")
    assert response.status_code == 200
    data = response.json()
    assert data["destination"] == "Manali"
    assert "current_temp_c" in data
    assert "condition" in data
    assert "advisory" in data
    assert len(data["forecast_3_day"]) == 3


def test_safety_score_endpoint():
    response = client.get("/api/safety-score?state=Himachal+Pradesh")
    assert response.status_code == 200
    data = response.json()
    assert data["safety_score"] >= 90
    assert data["risk_level"] == "Low"
    assert data["emergency_helpline"] == "112"
    assert data["tourist_police_helpline"] == "1363"
