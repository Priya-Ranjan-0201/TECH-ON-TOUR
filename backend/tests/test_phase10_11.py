"""
Tests for Phase 10 & Phase 11: Grand Finale Readiness & Stress Testing.
Validates 3.5s circuit breaker, deterministic offline solver resilience,
and complete DPI transaction rail stability for Hackathon Pitch rehearsal.
"""

import pytest
import time
from fastapi.testclient import TestClient

from app.main import app
from app.services.itinerary_service import ItineraryService
from app.schemas.itinerary import ItineraryRequest

client = TestClient(app)


def test_grand_finale_health_and_version():
    """Verify system health, DB connection, and platform integrity."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data


def test_itinerary_circuit_breaker_sla():
    """
    EXIT CRITERIA: Verify itinerary generation strictly obeys <= 3.5s SLA
    even under complex constraints, ensuring auditorium WiFi resilience.
    """
    t0 = time.time()
    payload = {
        "destination": "Jibhi",
        "state": "Himachal Pradesh",
        "days": 4,
        "budget": "moderate",
        "interests": ["Nature & Wildlife", "Rural & PM-JUGA Stays"],
        "pace": "moderate"
    }
    res = client.post("/api/itinerary/generate", json=payload)
    duration = time.time() - t0

    assert res.status_code == 201
    assert duration <= 3.5  # Must generate within 3.5 seconds
    data = res.json()
    assert len(data["days_schedule"]) == 4
    assert data["budget_breakdown"]["total_inr"] > 0
    assert data["eco_footprint"]["carbon_saved_pct"] > 0


def test_deterministic_offline_solver_direct():
    """
    Verify the deterministic offline graph solver functions autonomously
    with 0 external network dependencies if venue WiFi is severed.
    """
    req = ItineraryRequest(
        destination="Tirthan Valley",
        state="Himachal Pradesh",
        days=3,
        budget="budget",
        interests=["Adventure & Treks"]
    )
    # Direct solver call
    response = ItineraryService._deterministic_graph_solver(req, [], "Himachal Pradesh", [])
    assert response is not None
    assert response.days == 3
    assert len(response.days_schedule) == 3
    assert response.generation_source == "deterministic-graph-solver"


def test_end_to_end_dpi_flow_ready():
    """
    Full End-to-End Grand Finale Pitch Walkthrough:
    1. Check DMO Saturation
    2. Toggle Eco-Permit Gatekeeper
    3. Generate Itinerary
    4. Calculate Split-UPI Nodal Payout
    """
    # 1. Check DMO Analytics
    dmo_res = client.get("/api/dmo/analytics")
    assert dmo_res.status_code == 200
    assert dmo_res.json()["platform_metrics"]["total_destinations"] > 0

    # 2. Toggle permit on Manali
    lock_res = client.post(
        "/api/dmo/eco-permit/toggle",
        json={"destination": "Manali", "state": "Himachal Pradesh", "is_locked": True}
    )
    assert lock_res.status_code == 200
    assert lock_res.json()["is_locked"] is True

    # 3. Generate Itinerary -> Should reroute to Tirthan Valley / Jibhi
    itin_res = client.post(
        "/api/itinerary/generate",
        json={"destination": "Manali", "state": "Himachal Pradesh", "days": 3}
    )
    assert itin_res.status_code == 201
    itin_data = itin_res.json()
    assert itin_data["eco_permit_rerouted"] is True

    # 4. Generate Split-UPI checkout for the trip
    checkout_payload = {
        "place_name": "Tirthan River Cedar Wood Homestay",
        "base_tariff": 4500.0,
        "host_name": "Somaru Mandavi",
        "host_vpa": "somaru.bastar@upi",
        "nights": 3,
        "guests": 2,
        "include_guide": True,
        "guide_fee": 1000.0,
        "include_driver": False
    }
    pay_res = client.post("/api/checkout/split-upi", json=checkout_payload)
    assert pay_res.status_code == 201
    pay_data = pay_res.json()
    assert pay_data["success"] is True
    assert pay_data["splits"]["host_net_payout"] == 4365.0  # 97% of 4500
    assert pay_data["splits"]["platform_fee"] == 135.0      # 3% of 4500
    assert "upi://" in pay_data["primary_upi_intent"]
