import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_sample_itineraries():
    """Verify curated samples endpoint returns pre-compiled circuits."""
    response = client.get("/api/itinerary/samples")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    sample_ids = [s["id"] for s in data]
    assert "sample-rajasthan-3d" in sample_ids
    assert "sample-himachal-4d" in sample_ids
    assert "sample-kerala-3d" in sample_ids

    first = data[0]
    assert "title" in first
    assert "days" in first
    assert first["ota_commission_saved_inr"] > 0


def test_generate_itinerary_rajasthan():
    """Verify itinerary generation for Rajasthan with moderate budget."""
    payload = {
        "state": "Rajasthan",
        "days": 3,
        "budget": "moderate",
        "interests": ["Heritage & Monuments", "Culinary & Street Food"],
        "pace": "moderate",
        "group_type": "couple",
        "mobility": "moderate",
    }
    response = client.post("/api/itinerary/generate", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["state"] == "Rajasthan"
    assert data["days"] == 3
    assert data["budget"] == "moderate"
    assert len(data["days_schedule"]) == 3

    # Check day structure
    day1 = data["days_schedule"][0]
    assert day1["day_number"] == 1
    assert len(day1["stops"]) == 3  # Morning, Afternoon, Evening
    assert day1["day_cost_inr"] > 0

    # Check stop structure
    stop1 = day1["stops"][0]
    assert "Morning" in stop1["time_slot"]
    assert stop1["latitude"] != 0.0
    assert stop1["longitude"] != 0.0
    assert stop1["insider_tip"] is not None

    # Check budget breakdown & zero-commission savings
    breakdown = data["budget_breakdown"]
    assert breakdown["total_inr"] > 0
    assert breakdown["ota_commission_saved_inr"] == int(breakdown["total_inr"] * 0.18)

    # Check persistence ID
    itinerary_id = data["id"]
    assert itinerary_id is not None

    # Verify retrieval by ID
    get_res = client.get(f"/api/itinerary/{itinerary_id}")
    assert get_res.status_code == 200
    saved = get_res.json()
    assert saved["id"] == itinerary_id
    assert saved["title"] == data["title"]


def test_generate_itinerary_himachal_budget():
    """Verify 4-day budget itinerary generation for Himachal Pradesh."""
    payload = {
        "state": "Himachal Pradesh",
        "days": 4,
        "budget": "budget",
        "interests": ["Nature & Wildlife", "Rural & PM-JUGA Stays"],
        "pace": "active",
        "group_type": "solo",
    }
    response = client.post("/api/itinerary/generate", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["state"] == "Himachal Pradesh"
    assert data["days"] == 4
    assert len(data["days_schedule"]) == 4
    assert data["budget_breakdown"]["total_inr"] < 25000  # Budget tier check


def test_generate_itinerary_invalid_days():
    """Verify validation error when requesting >7 or <1 days."""
    payload = {
        "state": "Kerala",
        "days": 10,  # Exceeds max 7
        "budget": "moderate",
    }
    response = client.post("/api/itinerary/generate", json=payload)
    assert response.status_code == 422  # Pydantic validation error


def test_get_nonexistent_itinerary():
    """Verify 404 for unknown itinerary UUID."""
    response = client.get("/api/itinerary/non-existent-uuid-0000")
    assert response.status_code == 404
