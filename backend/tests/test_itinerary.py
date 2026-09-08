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


def test_generate_itinerary_rajasthan_and_features():
    """Verify itinerary generation for Rajasthan with TransitGuard, EcoFootprint & Cultural pairing."""
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

    # Check day structure & culinary highlight
    day1 = data["days_schedule"][0]
    assert day1["day_number"] == 1
    assert len(day1["stops"]) == 3
    assert day1["day_cost_inr"] > 0
    assert day1["culinary_highlight"] is not None
    assert "Thali" in day1["culinary_highlight"] or "Kachori" in day1["culinary_highlight"] or "Dal" in day1["culinary_highlight"]

    # Check stop structure & TransitGuard details
    stop1 = day1["stops"][0]
    assert "Morning" in stop1["time_slot"]
    assert stop1["latitude"] != 0.0
    assert stop1["longitude"] != 0.0
    assert stop1["insider_tip"] is not None

    stop2 = day1["stops"][1]
    assert stop2["transit_from_previous_km"] is not None
    assert stop2["transit_from_previous_km"] > 0
    assert stop2["transit_time_minutes"] is not None
    assert stop2["transit_guard_fare_inr"] is not None
    assert stop2["transit_mode"] is not None

    # Check EcoFootprint metrics
    assert data["eco_footprint"] is not None
    eco = data["eco_footprint"]
    assert eco["carbon_kg"] > 0
    assert eco["commercial_tour_carbon_kg"] > eco["carbon_kg"]
    assert eco["carbon_saved_pct"] >= 45
    assert eco["eco_tokens_awarded"] > 0

    # Check budget breakdown & zero-commission savings
    breakdown = data["budget_breakdown"]
    assert breakdown["total_inr"] > 0
    assert breakdown["ota_commission_saved_inr"] == int(breakdown["total_inr"] * 0.18)

    itinerary_id = data["id"]
    assert itinerary_id is not None

    # Verify retrieval by ID
    get_res = client.get(f"/api/itinerary/{itinerary_id}")
    assert get_res.status_code == 200
    saved = get_res.json()
    assert saved["id"] == itinerary_id


def test_stop_alternatives_and_swap():
    """Verify fetching alternatives and swapping a stop on an itinerary."""
    # 1. Generate an itinerary first
    gen_res = client.post(
        "/api/itinerary/generate",
        json={"state": "Rajasthan", "days": 2, "budget": "budget"},
    )
    assert gen_res.status_code == 201
    itin_data = gen_res.json()
    itin_id = itin_data["id"]

    # 2. Get alternatives for Day 1, Stop 0
    alt_res = client.get(f"/api/itinerary/{itin_id}/alternatives?day_number=1&stop_index=0")
    assert alt_res.status_code == 200
    alternatives = alt_res.json()
    assert len(alternatives) > 0
    new_dest = alternatives[0]
    assert "destination_id" in new_dest
    assert "name" in new_dest

    # 3. Swap stop
    swap_payload = {
        "day_number": 1,
        "stop_index": 0,
        "new_destination_id": new_dest["destination_id"],
    }
    swap_res = client.post(f"/api/itinerary/{itin_id}/swap-stop", json=swap_payload)
    assert swap_res.status_code == 200
    swapped_itin = swap_res.json()
    assert swapped_itin["days_schedule"][0]["stops"][0]["destination_id"] == new_dest["destination_id"]
    assert swapped_itin["days_schedule"][0]["stops"][0]["destination_name"] == new_dest["name"]


def test_reorder_stops():
    """Verify reordering stops on a day."""
    gen_res = client.post(
        "/api/itinerary/generate",
        json={"state": "Rajasthan", "days": 2, "budget": "moderate"},
    )
    assert gen_res.status_code == 201
    itin_data = gen_res.json()
    itin_id = itin_data["id"]

    orig_first_dest = itin_data["days_schedule"][0]["stops"][0]["destination_id"]
    orig_second_dest = itin_data["days_schedule"][0]["stops"][1]["destination_id"]

    # Invert order of first two stops: [1, 0, 2]
    reorder_payload = {
        "day_number": 1,
        "new_order": [1, 0, 2],
    }
    reorder_res = client.post(f"/api/itinerary/{itin_id}/reorder-stops", json=reorder_payload)
    assert reorder_res.status_code == 200
    updated = reorder_res.json()
    assert updated["days_schedule"][0]["stops"][0]["destination_id"] == orig_second_dest
    assert updated["days_schedule"][0]["stops"][1]["destination_id"] == orig_first_dest


def test_export_ics_calendar():
    """Verify RFC 5545 iCalendar (.ics) generation."""
    gen_res = client.post(
        "/api/itinerary/generate",
        json={"state": "Kerala", "days": 2, "budget": "luxury"},
    )
    itin_id = gen_res.json()["id"]

    ics_res = client.get(f"/api/itinerary/{itin_id}/export/ics")
    assert ics_res.status_code == 200
    assert "text/calendar" in ics_res.headers["content-type"]
    text = ics_res.text
    assert "BEGIN:VCALENDAR" in text
    assert "VERSION:2.0" in text
    assert "BEGIN:VEVENT" in text
    assert "SUMMARY:" in text
    assert "GEO:" in text
    assert "END:VCALENDAR" in text


def test_convert_to_rfp():
    """Verify converting itinerary to Travel RFP for local host bidding."""
    gen_res = client.post(
        "/api/itinerary/generate",
        json={"state": "Himachal Pradesh", "days": 3, "budget": "budget"},
    )
    itin_id = gen_res.json()["id"]

    rfp_res = client.post(
        f"/api/itinerary/{itin_id}/rfp",
        json={"traveler_notes": "Traveling with family, prefer quiet mountain village homestay."},
    )
    assert rfp_res.status_code == 200
    rfp = rfp_res.json()
    assert "rfp_id" in rfp
    assert rfp["status"] == "broadcast_active"
    assert rfp["eligible_hosts_alerted"] > 0
    assert rfp["platform_commission_inr"] == 0


def test_generate_itinerary_invalid_days():
    """Verify validation error when requesting >7 or <1 days."""
    payload = {
        "state": "Kerala",
        "days": 10,
        "budget": "moderate",
    }
    response = client.post("/api/itinerary/generate", json=payload)
    assert response.status_code == 422


def test_get_nonexistent_itinerary():
    """Verify 404 for unknown itinerary UUID."""
    response = client.get("/api/itinerary/non-existent-uuid-0000")
    assert response.status_code == 404
