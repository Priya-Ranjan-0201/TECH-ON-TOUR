import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_admin_stats():
    response = client.get("/api/admin/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_listings" in data
    assert "destinations_count" in data
    assert "system_health" in data

def test_admin_listings():
    response = client.get("/api/admin/listings")
    assert response.status_code == 200
    data = response.json()
    assert "listings" in data
    assert isinstance(data["listings"], list)
    assert len(data["listings"]) > 0

def test_admin_listing_status_workflow():
    listings_res = client.get("/api/admin/listings")
    assert listings_res.status_code == 200
    listings = listings_res.json()["listings"]
    target_id = listings[0]["id"]

    # Suspend
    suspend_res = client.post(f"/api/admin/listings/{target_id}/status", json={"status": "suspended"})
    assert suspend_res.status_code == 200
    assert suspend_res.json()["is_verified"] is False

    # Approve back
    approve_res = client.post(f"/api/admin/listings/{target_id}/status", json={"status": "verified"})
    assert approve_res.status_code == 200
    assert approve_res.json()["is_verified"] is True
