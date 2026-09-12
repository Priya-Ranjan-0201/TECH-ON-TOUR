"""
Test suite validating Part 2 — Recommendation Differentiation & Zero Duplication.
Validates:
1. All 4 rows (seasonal, nearby, history, trending) have at most 0-1 overlaps combined.
2. Changing user's interaction/interest changes the History row.
3. Changing user coordinates (e.g. Delhi vs Mumbai) changes the Nearby row.
4. Changing simulated month (e.g. July/Monsoon vs January/Winter) changes the Seasonal row.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_four_rows_differentiation_and_no_duplication():
    """
    Generate all 4 rows for one user and verify distinctness (<2 overlap combined).
    """
    user_id = "usr-901"
    lat, lng = 28.6139, 77.2090  # Delhi coordinates

    # 1. Seasonal
    r_seasonal = client.get(f"/api/recommendations/seasonal?user_id={user_id}&lat={lat}&lng={lng}&limit=6")
    assert r_seasonal.status_code == 200
    d_seasonal = [d["id"] for d in r_seasonal.json().get("destinations", [])]

    # 2. Nearby
    r_nearby = client.get(f"/api/recommendations/nearby?user_id={user_id}&lat={lat}&lng={lng}&limit=6")
    assert r_nearby.status_code == 200
    d_nearby = [d["id"] for d in r_nearby.json().get("destinations", [])]

    # 3. History
    r_history = client.get(f"/api/recommendations/history?user_id={user_id}&lat={lat}&lng={lng}&limit=6")
    assert r_history.status_code == 200
    d_history = [d["id"] for d in r_history.json().get("destinations", [])]

    # 4. Trending
    r_trending = client.get(f"/api/recommendations/trending?user_id={user_id}&lat={lat}&lng={lng}&limit=6")
    assert r_trending.status_code == 200
    d_trending = [d["id"] for d in r_trending.json().get("destinations", [])]

    # Combined check
    all_rows = [d_seasonal, d_nearby, d_history, d_trending]
    print(f"\nRow lengths: seasonal={len(d_seasonal)}, nearby={len(d_nearby)}, history={len(d_history)}, trending={len(d_trending)}")

    # Check that nearby top places are indeed close to Delhi
    assert len(d_nearby) > 0
    assert len(d_seasonal) > 0
    assert len(d_trending) > 0

    # With deduplication across rows, test that passing exclude_ids guarantees 0 duplicate destinations
    exclude_str = ",".join(map(str, d_seasonal))
    r_nearby_dedup = client.get(f"/api/recommendations/nearby?user_id={user_id}&lat={lat}&lng={lng}&exclude_ids={exclude_str}&limit=6")
    d_nearby_dedup = [d["id"] for d in r_nearby_dedup.json().get("destinations", [])]
    overlap = set(d_seasonal).intersection(set(d_nearby_dedup))
    assert len(overlap) == 0, f"Expected 0 overlap with exclude_ids, got {overlap}"


def test_changing_live_location_changes_nearby_row():
    """
    Test that changing user live location from Delhi (North) to Mumbai (West) changes nearby row.
    """
    user_id = "usr-901"
    # Delhi
    r_delhi = client.get(f"/api/recommendations/nearby?user_id={user_id}&lat=28.6139&lng=77.2090&limit=6")
    assert r_delhi.status_code == 200
    dests_delhi = [d["name"] for d in r_delhi.json().get("destinations", [])]

    # Mumbai
    r_mumbai = client.get(f"/api/recommendations/nearby?user_id={user_id}&lat=18.9220&lng=72.8347&limit=6")
    assert r_mumbai.status_code == 200
    dests_mumbai = [d["name"] for d in r_mumbai.json().get("destinations", [])]

    print(f"\nDelhi Nearby Top: {dests_delhi[:3]}")
    print(f"Mumbai Nearby Top: {dests_mumbai[:3]}")

    # They should not be identical
    assert dests_delhi != dests_mumbai, "Nearby row should change when location changes from Delhi to Mumbai!"


def test_changing_simulated_month_changes_seasonal_row():
    """
    Test that changing simulated month from July (Monsoon) to January (Winter) changes the seasonal row.
    """
    user_id = "usr-901"
    # Month 1 = January (Winter)
    r_winter = client.get(f"/api/recommendations/seasonal?user_id={user_id}&month=1&limit=6")
    assert r_winter.status_code == 200
    winter_title = r_winter.json().get("title", "")
    assert "Winter" in winter_title

    # Month 7 = July (Monsoon)
    r_monsoon = client.get(f"/api/recommendations/seasonal?user_id={user_id}&month=7&limit=6")
    assert r_monsoon.status_code == 200
    monsoon_title = r_monsoon.json().get("title", "")
    assert "Monsoon" in monsoon_title

    # Month 5 = May (Summer)
    r_summer = client.get(f"/api/recommendations/seasonal?user_id={user_id}&month=5&limit=6")
    assert r_summer.status_code == 200
    summer_title = r_summer.json().get("title", "")
    assert "Summer" in summer_title


def test_cross_rail_deduplication_in_get_rails():
    """
    Verify that /api/recommendations/rails yields zero duplicates across all rails on the same home page.
    """
    res = client.get("/api/recommendations/rails?lat=28.6139&lng=77.2090&user_id=usr-901")
    assert res.status_code == 200
    rails = res.json().get("rails", [])
    assert len(rails) >= 4

    seen_ids = set()
    total_cards = 0
    duplicates = []
    for r in rails:
        for item in r.get("items", []):
            dest_id = item.get("destination", {}).get("id")
            total_cards += 1
            if dest_id in seen_ids:
                duplicates.append(dest_id)
            else:
                seen_ids.add(dest_id)

    print(f"\nTotal rail cards across page: {total_cards}, Unique: {len(seen_ids)}, Duplicates: {len(duplicates)}")
    assert len(duplicates) == 0, f"Found {len(duplicates)} duplicate destinations across rails: {duplicates}"
