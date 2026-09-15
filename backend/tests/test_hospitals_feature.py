import sys
import os
import json
import urllib.request
import urllib.error
import math

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:8000/api"

def test_hospitals_locator():
    print("=== TEST 1: POST /api/nearby-hospitals (Zero Auth + Real GPS) ===")
    payload = {
        "latitude": 28.6139,
        "longitude": 77.2090, # Central New Delhi
        "radius_m": 10000
    }
    req = urllib.request.Request(
        f"{BASE_URL}/nearby-hospitals",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    res = urllib.request.urlopen(req, timeout=45)
    assert res.status == 200, f"Expected 200, got {res.status}"
    data = json.loads(res.read().decode("utf-8"))
    
    assert "hospitals" in data, "Missing 'hospitals' in response"
    assert "hourly_token" in data, "Missing 'hourly_token' in response (hourly token directive)"
    assert data["hourly_token"].startswith("tok_hourly_"), f"Invalid hourly token: {data['hourly_token']}"
    
    hospitals = data["hospitals"]
    print(f"✓ Retrieved {len(hospitals)} nearby hospitals (total OSM elements: {data.get('total')})")
    assert len(hospitals) > 0, "Expected at least 1 hospital returned"

    first = hospitals[0]
    print(f"✓ Nearest: {first['name']} ({first['type']}) - {first['distance_km']} km")
    assert "name" in first and len(first["name"]) > 0
    assert "type" in first and first["type"] in ("Hospital", "Clinic")
    assert "distance_km" in first and first["distance_km"] >= 0
    assert "maps_url" in first and "https://www.google.com/maps/dir/" in first["maps_url"]
    print(f"✓ Google Maps Turn-by-Turn URL verified: {first['maps_url']}")

    # Verify sorting by distance
    distances = [h["distance_km"] for h in hospitals]
    assert distances == sorted(distances), f"Hospitals not sorted by distance: {distances}"
    print(f"✓ Proximity sorting verified: {distances[:5]}")

    print("\n=== TEST 2: Response Caching on Repeat Request ===")
    req_repeat = urllib.request.Request(
        f"{BASE_URL}/nearby-hospitals",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    res_repeat = urllib.request.urlopen(req_repeat, timeout=10)
    data_repeat = json.loads(res_repeat.read().decode("utf-8"))
    assert data_repeat.get("cached") is True, "Repeat request was not served from cache!"
    assert data_repeat.get("hourly_token") == data.get("hourly_token")
    print(f"✓ Cache hit confirmed (cached=True, token={data_repeat['hourly_token']})")

    print("\n=== TEST 3: Rounded Coordinate Cache Hit (2 Decimals) ===")
    payload_slight_offset = {
        "latitude": 28.6141, # Rounds to 28.61
        "longitude": 77.2089  # Rounds to 77.21
    }
    req_offset = urllib.request.Request(
        f"{BASE_URL}/nearby-hospitals",
        data=json.dumps(payload_slight_offset).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    res_offset = urllib.request.urlopen(req_offset, timeout=10)
    data_offset = json.loads(res_offset.read().decode("utf-8"))
    assert data_offset.get("cached") is True, "Rounded coordinate did not hit 2-decimal cache!"
    print("✓ 2-decimal rounded coordinate caching hit verified")

    print("\n=== TEST 4: Essentials Toggle Query Reuse (hospital, hotel, restaurant) ===")
    payload_essentials = {
        "latitude": 28.6139,
        "longitude": 77.2090,
        "amenities": ["hospital", "hotel", "restaurant"]
    }
    req_essentials = urllib.request.Request(
        f"{BASE_URL}/nearby-hospitals",
        data=json.dumps(payload_essentials).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    res_essentials = urllib.request.urlopen(req_essentials, timeout=30)
    data_essentials = json.loads(res_essentials.read().decode("utf-8"))
    assert data_essentials.get("total", 0) > 0
    types = {h["type"] for h in data_essentials.get("hospitals", [])}
    print(f"✓ Essentials multi-amenity query successful, total: {data_essentials['total']}, types: {types}")

    print("\n=== TEST 5: Structured JSON Error Handling (No Raw Stack Trace) ===")
    invalid_req = urllib.request.Request(
        f"{BASE_URL}/nearby-hospitals",
        data=json.dumps({"latitude": "invalid_lat", "longitude": 77.2090}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        urllib.request.urlopen(invalid_req, timeout=10)
        assert False, "Should have failed with 422"
    except urllib.error.HTTPError as err:
        assert err.code == 422
        body = json.loads(err.read().decode("utf-8"))
        assert "error" in body, "Error JSON missing 'error' key"
        print(f"✓ Global exception handling confirmed: status={err.code}, error={body['error']}")

    print("\n=== ALL 5 TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_hospitals_locator()
