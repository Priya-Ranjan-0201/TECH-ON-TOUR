"""
Tests for Phase 9: DMO Command Center & Anti-Overtourism Engine.
Validates real-time footfall analytics, eco-permit gatekeeper toggle,
itinerary diversion to secondary circuits (Manali -> Tirthan Valley & Jibhi),
and IndicVoice Concierge throttling alerts.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.api.dmo import ECO_PERMIT_STATE

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_permit_state():
    """Ensure clean eco-permit state before and after each test."""
    ECO_PERMIT_STATE.clear()
    yield
    ECO_PERMIT_STATE.clear()


def test_dmo_analytics_endpoint():
    """Verify DMO analytics returns complete platform metrics and heatmap nodes."""
    res = client.get("/api/dmo/analytics")
    assert res.status_code == 200
    data = res.json()

    assert "platform_metrics" in data
    assert "heatmap_data" in data
    assert "overtourism_hotspots" in data
    assert "circuit_alternatives" in data
    assert "eco_permit_locks" in data

    # Verify heatmap nodes contain carrying capacities and saturation scores
    heatmap = data["heatmap_data"]
    manali_node = next((n for n in heatmap if n["name"].lower() == "manali"), None)
    assert manali_node is not None
    assert manali_node["saturation"] >= 90
    assert manali_node["status"] == "CRITICAL"
    assert manali_node["carrying_capacity"] > 0


def test_eco_permit_toggle():
    """Verify administrative toggle locks and unlocks destinations."""
    # 1. Lock Manali
    toggle_payload = {
        "destination": "Manali",
        "state": "Himachal Pradesh",
        "is_locked": True,
        "reason": "Monsoon landslide risk and carrying capacity breach"
    }
    lock_res = client.post("/api/dmo/eco-permit/toggle", json=toggle_payload)
    assert lock_res.status_code == 200
    lock_data = lock_res.json()
    assert lock_data["success"] is True
    assert lock_data["is_locked"] is True
    assert "Tirthan Valley & Jibhi" in lock_data["diverted_to"]

    # 2. Check status endpoint
    status_res = client.get("/api/dmo/eco-permit/status")
    assert status_res.status_code == 200
    assert status_res.json()["count"] == 1
    assert status_res.json()["active_locks"]["manali"] is True

    # 3. Check individual check endpoint
    check_res = client.get("/api/dmo/eco-permit/check/manali")
    assert check_res.status_code == 200
    check_data = check_res.json()
    assert check_data["is_locked"] is True
    assert check_data["alternative"]["alternative"] == "Tirthan Valley & Jibhi"

    # 4. Unlock Manali
    toggle_payload["is_locked"] = False
    unlock_res = client.post("/api/dmo/eco-permit/toggle", json=toggle_payload)
    assert unlock_res.status_code == 200
    assert unlock_res.json()["is_locked"] is False

    # 5. Verify unlocked status
    check_res2 = client.get("/api/dmo/eco-permit/check/manali")
    assert check_res2.json()["is_locked"] is False


def test_itinerary_redirection_on_permit_lock():
    """
    EXIT CRITERIA: Toggling permit lock on Manali redirects new itinerary queries
    to secondary green circuit (Tirthan Valley / Jibhi).
    """
    # 1. Lock Manali
    client.post(
        "/api/dmo/eco-permit/toggle",
        json={
            "destination": "Manali",
            "state": "Himachal Pradesh",
            "is_locked": True
        }
    )

    # 2. Generate itinerary for Manali
    payload = {
        "destination": "Manali",
        "state": "Himachal Pradesh",
        "days": 3,
        "budget": "moderate",
        "interests": ["Nature & Wildlife", "Adventure & Treks"],
        "pace": "moderate"
    }
    itin_res = client.post("/api/itinerary/generate", json=payload)
    assert itin_res.status_code in (200, 201)
    itin = itin_res.json()

    # 3. Verify destination was diverted to Tirthan Valley & Jibhi
    assert "Tirthan Valley" in itin["destination"] or "Jibhi" in itin["destination"]
    assert itin["eco_permit_rerouted"] is True
    assert itin["original_destination"] == "Manali"
    assert "Eco-Permit Throttling Active" in itin["summary"]
    assert itin["diversion_advisory"] is not None

    # 4. Unlock Manali
    client.post(
        "/api/dmo/eco-permit/toggle",
        json={
            "destination": "Manali",
            "state": "Himachal Pradesh",
            "is_locked": False
        }
    )

    # 5. Generate again; verify normal generation without rerouting
    itin_res2 = client.post("/api/itinerary/generate", json=payload)
    assert itin_res2.status_code in (200, 201)
    itin2 = itin_res2.json()
    assert itin2["eco_permit_rerouted"] is False


def test_concierge_eco_permit_advisory():
    """Verify AI Concierge proactively advises travelers about permit locks."""
    # 1. Lock Manali
    client.post(
        "/api/dmo/eco-permit/toggle",
        json={
            "destination": "Manali",
            "state": "Himachal Pradesh",
            "is_locked": True
        }
    )

    # 2. Query Concierge about Manali in English
    chat_payload = {
        "message": "Can I visit Manali this weekend?",
        "language": "en",
        "history": []
    }
    chat_res = client.post("/api/chat/concierge", json=chat_payload)
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert "Eco-Permit Advisory" in chat_data["response_text"]
    assert "Tirthan Valley" in chat_data["response_text"]

    # 3. Query in Hindi
    chat_payload_hi = {
        "message": "क्या मैं मनाली घूमने जा सकता हूँ?",
        "language": "hi",
        "history": []
    }
    chat_res_hi = client.post("/api/chat/concierge", json=chat_payload_hi)
    assert chat_res_hi.status_code == 200
    chat_data_hi = chat_res_hi.json()
    assert "इको-परमिट गेटकीपर अलर्ट" in chat_data_hi["response_text"]
    assert "तीर्थन घाटी" in chat_data_hi["response_text"] or "Tirthan Valley" in chat_data_hi["response_text"]
