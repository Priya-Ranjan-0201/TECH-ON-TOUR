"""
PyTest Suite for Reverse Marketplace & Host Seller Hub.
Tests tourist RFP broadcast, host competitive bidding, bid acceptance, and dynamic pricing co-pilot.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_open_rfps():
    """Verify GET /api/marketplace/rfps returns active traveler inquiries."""
    response = client.get("/api/marketplace/rfps")
    assert response.status_code == 200
    rfps = response.json()
    assert isinstance(rfps, list)
    assert len(rfps) > 0
    assert "target_budget_inr" in rfps[0]
    assert "destination" in rfps[0]


def test_create_and_bid_rfp_flow():
    """Verify complete RFP broadcast -> host bid -> bid acceptance loop."""
    # 1. Create RFP
    rfp_payload = {
        "destination": "Chitrakote",
        "state": "Chhattisgarh",
        "days": 3,
        "target_budget_inr": 4800.0,
        "traveler_name": "Karan Malhotra",
        "notes": "Looking for tribal homestay near falls with Dhokra art session."
    }
    rfp_res = client.post("/api/marketplace/rfp", json=rfp_payload)
    assert rfp_res.status_code == 201
    rfp_data = rfp_res.json()
    rfp_id = rfp_data["rfp_id"]

    # 2. Host submits bid
    bid_payload = {
        "rfp_id": rfp_id,
        "host_id": "host-bastar-01",
        "host_name": "Mangal Mandavi",
        "homestay_name": "Bastar Dhokra Craft & Forest Homestay",
        "bid_amount_inr": 4200.0,
        "inclusions": "3 Nights Homestay + Chulha Meals + Lost-wax metal craft class",
        "message": "Welcome to Bastar! We would love to host your family."
    }
    bid_res = client.post("/api/marketplace/bid", json=bid_payload)
    assert bid_res.status_code == 201
    bid_data = bid_res.json()
    assert bid_data["success"] is True
    assert bid_data["host_payout_inr"] == 4074.0  # 97% of 4200
    bid_id = bid_data["bid_id"]

    # 3. Traveler accepts bid
    accept_res = client.post(f"/api/marketplace/bid/{bid_id}/accept")
    assert accept_res.status_code == 200
    accept_data = accept_res.json()
    assert accept_data["success"] is True
    assert "TS-UPI-" in accept_data["booking_ref"]
    assert accept_data["platform_commission_saved_inr"] > 0


def test_host_dashboard_telemetry():
    """Verify GET /api/host/dashboard returns financial metrics and dynamic pricing."""
    response = client.get("/api/host/dashboard?host_id=host-bastar-01&state=Chhattisgarh")
    assert response.status_code == 200
    data = response.json()
    assert "host_profile" in data
    assert data["host_profile"]["pm_juga_certified"] is True
    assert data["host_profile"]["sanitation_trust_score"] >= 90
    assert "financial_metrics" in data
    assert data["financial_metrics"]["ota_commission_saved_inr"] > 0
    assert "dynamic_pricing_co_pilot" in data
    assert "open_rfps_in_district" in data


def test_pricing_recommendation_festival_intelligence():
    """Verify AI Dynamic Pricing Co-Pilot incorporates Indian cultural events."""
    response = client.get("/api/host/pricing-recommendation?state=Rajasthan&base_tariff=2000")
    assert response.status_code == 200
    data = response.json()
    assert "recommended_tariff_inr" in data
    assert data["recommended_tariff_inr"] >= 2000
    assert "surge_percentage" in data
    assert "demand_driver" in data
    assert "algorithm_info" in data


def test_apply_dynamic_pricing():
    """Verify POST /api/host/pricing/apply updates host tariff."""
    payload = {
        "host_id": "host-bastar-01",
        "state": "Chhattisgarh",
        "new_tariff_inr": 1950.0
    }
    response = client.post("/api/host/pricing/apply", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["updated_tariff_inr"] == 1950.0
