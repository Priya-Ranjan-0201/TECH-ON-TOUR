import urllib.request
import urllib.parse
import json
import sqlite3
import os
import sys

BASE_URL = "http://127.0.0.1:8000"

def get(path):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={"User-Agent": "TravelSathi-E2E-Tester"})
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as err:
        try:
            body = json.loads(err.read().decode())
        except Exception:
            body = {"error": str(err)}
        return err.code, body
    except Exception as ex:
        return 500, {"error": str(ex)}

def post(path, payload):
    url = f"{BASE_URL}{path}"
    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={"Content-Type": "application/json", "User-Agent": "TravelSathi-E2E-Tester"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as err:
        try:
            body = json.loads(err.read().decode())
        except Exception:
            body = {"error": str(err)}
        return err.code, body
    except Exception as ex:
        return 500, {"error": str(ex)}

def run_tests():
    print("============================================================")
    print("TRAVELSATHI / DESHORA COMPLETE E2E VERIFICATION TEST SUITE")
    print("============================================================")

    # 1. Test Database directly
    print("\n[TEST 1] Testing Database Directly (Single Source of Truth)...")
    db_path = os.path.join(os.path.dirname(__file__), "..", "travelsathi_dev.db")
    if not os.path.exists(db_path):
        db_path = os.path.join(os.path.dirname(__file__), "..", "app", "database", "travelsathi_dev.db")
    
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM destinations_master")
    total_db_count = cur.fetchone()[0]
    print(f"  [OK] Database destinations count: {total_db_count}")
    assert total_db_count >= 12000, f"Expected >= 12,000 destinations, found {total_db_count}"

    cur.execute("SELECT id, name, state, latitude, longitude, rating, category FROM destinations_master WHERE name LIKE '%Manali%' LIMIT 1")
    sample = cur.fetchone()
    sample_manali_id = sample[0]
    sample_manali_name = sample[1]
    print(f"  [OK] Sample Manali DB row: ID={sample[0]}, Name='{sample[1]}', State='{sample[2]}', Lat={sample[3]}, Lng={sample[4]}, Rating={sample[5]}")
    conn.close()

    # 2. Test Search Queries
    print("\n[TEST 2] Testing Search API (/api/destinations/search)...")
    test_queries = [
        ("Manali", "Manali"),
        ("Punjab", "Punjab"),
        ("mountain", "Mountain/Himalayan"),
        ("beach", "Beach/Coastal"),
        ("temple", "Temple/Spiritual"),
        ("man", "Partial match prefix"),
        ("  mAnAlI  ", "Whitespace and case tolerance")
    ]

    for q, desc in test_queries:
        encoded_q = urllib.parse.quote(q)
        status, data = get(f"/api/destinations/search?q={encoded_q}&limit=5")
        print(f"  Search '{q}' ({desc}): status={status}, count={data.get('count', 0)}")
        assert status == 200, f"Search '{q}' failed with status {status}"
        assert data.get("success") is True, f"Search '{q}' response success is not True"
        assert len(data.get("results", [])) > 0, f"Search '{q}' returned 0 results"
        first = data["results"][0]
        print(f"    -> First result: ID={first.get('id')}, Name='{first.get('name')}', State='{first.get('state')}', Rating={first.get('rating')}")
        assert first.get("id") is not None, "Destination ID must not be None"
        assert first.get("name") is not None, "Destination Name must not be None"

    # 3. Test Destination Details API
    print(f"\n[TEST 3] Testing Destination Details API (/api/destinations/{sample_manali_id})...")
    status, d_data = get(f"/api/destinations/{sample_manali_id}")
    print(f"  Status: {status}, Success: {d_data.get('success')}")
    assert status == 200, f"Detail endpoint returned {status}"
    dest = d_data.get("destination", {})
    assert dest.get("id") == sample_manali_id, f"Returned ID mismatch: {dest.get('id')} != {sample_manali_id}"
    assert dest.get("name") == sample_manali_name, f"Returned Name mismatch: {dest.get('name')} != {sample_manali_name}"
    print(f"  [OK] Name: {dest.get('name')}")
    print(f"  [OK] State: {dest.get('state')}")
    print(f"  [OK] District: {dest.get('district')}")
    print(f"  [OK] Category: {dest.get('category')}")
    print(f"  [OK] Coordinates: ({dest.get('latitude')}, {dest.get('longitude')})")
    print(f"  [OK] Rating: {dest.get('rating')}")
    print(f"  [OK] Estimated Budget: INR {dest.get('average_budget')}")
    print(f"  [OK] Recommended Days: {dest.get('recommended_days')}")
    print(f"  [OK] Activities: {dest.get('activities')}")

    # 4. Test 404 for invalid destination
    print("\n[TEST 4] Testing 404 for non-existent Destination ID...")
    status_404, res_404 = get("/api/destinations/99999999")
    print(f"  Invalid ID 99999999 status: {status_404} ({res_404.get('detail')})")
    assert status_404 == 404, f"Expected 404 for invalid ID, got {status_404}"

    # 5. Test Recommendations Rails API
    print("\n[TEST 5] Testing Recommendations Rails (/api/recommendations/rails)...")
    status, r_data = get("/api/recommendations/rails")
    print(f"  Status: {status}, Rails count: {len(r_data.get('rails', []))}")
    assert status == 200
    rails = r_data.get("rails", [])
    assert len(rails) > 0, "Expected at least 1 recommendation rail"
    for r in rails[:2]:
        items = r.get("items", [])
        print(f"  [OK] Rail '{r.get('title')}': {len(items)} destinations")
        if items:
            sample_item = items[0]
            d_obj = sample_item.get("destination", sample_item)
            assert d_obj.get("id") is not None, "Rail item must have valid destination ID"

    # 6. Test Nearby Places API
    print(f"\n[TEST 6] Testing Nearby Places API (/api/recommendations/nearby?destination_id={sample_manali_id})...")
    status, n_data = get(f"/api/recommendations/nearby?destination_id={sample_manali_id}&top_k=4")
    print(f"  Status: {status}, Count: {n_data.get('count', 0)}")
    assert status == 200
    nearby = n_data.get("results") or n_data.get("nearby_destinations", [])
    assert len(nearby) > 0, "Expected at least 1 nearby destination"
    for nb in nearby[:2]:
        print(f"  [OK] Nearby: ID={nb.get('destination_id') or nb.get('id')}, Name='{nb.get('name')}', Dist={nb.get('distance_km')} km, Rating={nb.get('rating')}")
        assert nb.get("name") is not None

    # 7. Test Similar Places API
    print(f"\n[TEST 7] Testing Similar Destinations API (/api/recommendations/similar?destination_id={sample_manali_id})...")
    status, s_data = get(f"/api/recommendations/similar?destination_id={sample_manali_id}&top_k=4")
    print(f"  Status: {status}, Source: {s_data.get('source_destination')}")
    assert status == 200
    sims = s_data.get("similar_destinations", [])
    assert len(sims) > 0, "Expected at least 1 similar destination"
    for s in sims[:2]:
        print(f"  [OK] Similar: ID={s.get('destination_id') or s.get('id')}, Name='{s.get('name') or s.get('destination')}', Match={s.get('similarity_score')}")
        assert (s.get("name") or s.get("destination")) is not None

    # 8. Test Interaction Recording
    print(f"\n[TEST 8] Testing Interaction Recording (/api/recommendations/interaction)...")
    post_status, post_data = post("/api/recommendations/interaction", {
        "user_id": "usr-901",
        "destination_id": sample_manali_id,
        "interaction_type": "click"
    })
    print(f"  Status: {post_status}, Result: {post_data.get('status')}")
    assert post_status == 200
    assert post_data.get("status") == "interaction_logged"

    print("\n============================================================")
    print("[SUCCESS] ALL 8 COMPREHENSIVE E2E TESTS PASSED WITH ZERO FAILURES!")
    print("============================================================")

if __name__ == "__main__":
    run_tests()
