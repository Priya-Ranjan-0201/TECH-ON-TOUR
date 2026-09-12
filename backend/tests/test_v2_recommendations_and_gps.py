import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_recommendation_rails_cold_start():
    """Verifies that cold-start users receive 7 complete rails with diverse items."""
    resp = client.get("/api/recommendations/rails?user_id=new_traveler_1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert "season" in data
    assert len(data["rails"]) == 7

    rail_ids = [r["id"] for r in data["rails"]]
    assert "season" in rail_ids
    assert "near_you" in rail_ids
    assert "recommended_for_you" in rail_ids
    assert "because_you_liked" in rail_ids
    assert "hidden_gems" in rail_ids
    assert "perfect_for_today" in rail_ids
    assert "popular_nearby" in rail_ids

    # Each rail should have items with explanations
    for rail in data["rails"]:
        assert len(rail["items"]) > 0
        first_item = rail["items"][0]
        assert "destination" in first_item
        assert "reason" in first_item
        assert len(first_item["reason"]) > 0
        dest = first_item["destination"]
        assert "name" in dest
        assert "state" in dest
        assert "rating" in dest
        assert "category" in dest


def test_recommendation_rails_with_gps():
    """Verifies that providing GPS coordinates calculates distance and drive time."""
    resp = client.get("/api/recommendations/rails?lat=28.6139&lng=77.2090&user_id=usr-901")
    assert resp.status_code == 200
    data = resp.json()
    assert data["has_gps"] is True

    # Check near_you rail
    near_rail = next(r for r in data["rails"] if r["id"] == "near_you")
    assert len(near_rail["items"]) > 0
    first_near = near_rail["items"][0]
    assert first_near["distance_km"] is not None
    assert first_near["drive_time_min"] is not None
    assert first_near["distance_km"] >= 0


def test_recommendation_feedback_signal():
    """Tests recording interaction signals for model learning."""
    payload = {
        "user_id": "usr-901",
        "destination_id": 1,
        "action_type": "click",
        "dwell_time_seconds": 12,
        "context_metadata": {"weather": "clear", "season": "monsoon"}
    }
    resp = client.post("/api/recommendations/feedback", json=payload)
    assert resp.status_code == 200
    assert resp.json()["status"] == "recorded"


def test_user_preferences_crud():
    """Tests fetching and updating personalization preferences."""
    # Update
    pref_data = {
        "user_id": "usr-test-pref",
        "age_group": "18-25",
        "travel_style": "adventure",
        "group_type": "friends",
        "preferred_categories": "nature,adventure,camping",
        "budget_tier": "budget",
        "food_preference": "non-vegetarian"
    }
    res_post = client.post("/api/recommendations/preferences", json=pref_data)
    assert res_post.status_code == 200

    # Get
    res_get = client.get("/api/recommendations/preferences/usr-test-pref")
    assert res_get.status_code == 200
    retrieved = res_get.json()
    assert retrieved["travel_style"] == "adventure"
    assert retrieved["group_type"] == "friends"


def test_location_session_and_ping_with_geofence():
    """Tests starting explicit GPS session and receiving geofence proximity alerts."""
    # 1. Start Session
    sess_payload = {
        "owner_user_id": "usr-901",
        "trip_id": "trip-test-1",
        "sharing_mode": "live_navigation",
        "allowed_members": ["Priya Sharma", "Rohan Verma"]
    }
    sess_res = client.post("/api/recommendations/location-session", json=sess_payload)
    assert sess_res.status_code == 200
    sess_data = sess_res.json()
    assert "session_id" in sess_data
    session_id = sess_data["session_id"]
    assert sess_data["expires_in_hours"] == 8

    # 2. Record Ping near Delhi / Qutub Minar (lat 28.5244, lng 77.1855)
    ping_payload = {
        "session_id": session_id,
        "latitude": 28.5244,
        "longitude": 77.1855,
        "accuracy_meters": 8.5,
        "speed_mps": 5.2,
        "heading_degrees": 180.0
    }
    ping_res = client.post("/api/recommendations/location-ping", json=ping_payload)
    assert ping_res.status_code == 200
    ping_data = ping_res.json()
    assert ping_data["status"] == "ping_recorded"


def test_netflix_recommendation_rows_and_cold_start():
    client = TestClient(app)

    # 1. Test Seasonal Row
    res_season = client.get("/api/recommendations/seasonal?user_id=usr-901")
    assert res_season.status_code == 200
    data_season = res_season.json()
    assert data_season["status"] == "success"
    assert data_season["row_type"] == "seasonal"
    assert len(data_season["destinations"]) >= 1
    card = data_season["destinations"][0]
    assert "name" in card
    assert "hook" in card
    assert "score" in card

    # 2. Test Trending Row
    res_trending = client.get("/api/recommendations/trending?user_id=usr-901")
    assert res_trending.status_code == 200
    data_trending = res_trending.json()
    assert data_trending["status"] == "success"
    assert len(data_trending["destinations"]) >= 1

    # 3. Test Nearby Row with GPS
    res_near = client.get("/api/recommendations/nearby?user_id=usr-901&lat=28.6139&lng=77.2090")
    assert res_near.status_code == 200
    data_near = res_near.json()
    assert data_near["status"] == "success"
    assert len(data_near["destinations"]) >= 1

    # 4. Test History Row Cold-Start Fallback (Unknown user)
    res_history = client.get("/api/recommendations/history?user_id=brand_new_cold_user_999")
    assert res_history.status_code == 200
    data_history = res_history.json()
    assert data_history["status"] == "success"
    assert len(data_history["destinations"]) >= 1

    # 5. Test Personal / For You Row
    res_for_you = client.get("/api/recommendations/personal?user_id=usr-901")
    assert res_for_you.status_code == 200
    data_for_you = res_for_you.json()
    assert data_for_you["status"] == "success"
    assert len(data_for_you["destinations"]) >= 1


def test_direct_gps_ping_and_interaction_logging():
    client = TestClient(app)

    # 1. Direct Ping via /api/location/ping
    ping_payload = {
        "user_id": "usr-live-test",
        "latitude": 28.5244,
        "longitude": 77.1855
    }
    ping_res = client.post("/api/location/ping", json=ping_payload)
    assert ping_res.status_code == 200
    data = ping_res.json()
    assert data["status"] == "location_updated"
    assert data["user_id"] == "usr-live-test"

    # 2. Read live location via /api/location/live/{user_id}
    live_res = client.get("/api/location/live/usr-live-test")
    assert live_res.status_code == 200
    live_data = live_res.json()
    assert live_data["has_location"] is True
    assert abs(live_data["latitude"] - 28.5244) < 0.001

    # 3. Log interaction via /api/recommendations/interaction
    inter_payload = {
        "user_id": "usr-live-test",
        "destination_id": 1,
        "interaction_type": "view"
    }
    inter_res = client.post("/api/recommendations/interaction", json=inter_payload)
    assert inter_res.status_code == 200
    inter_data = inter_res.json()
    assert inter_data["status"] == "interaction_logged"
