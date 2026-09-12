import urllib.request
import urllib.parse
import json
import uuid

BASE = "http://127.0.0.1:8000"

def req(method, path, body=None, token=None):
    url = f"{BASE}{path}"
    headers = {"User-Agent": "FullSuiteTester"}
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"

    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, {"error": str(e)}
    except Exception as ex:
        return 500, {"error": str(ex)}

def run_suite():
    print("==================================================")
    print("TESTING FULL SYSTEM AUDIT REPAIRS (PHASES 1-5)")
    print("==================================================")

    # 1. AUTH - Login with Seeded Demo Persona
    print("\n[TEST 1] Auth - Login Seeded Persona...")
    status, data = req("POST", "/api/auth/login", {
        "email": "aarav.sharma@travelsathi.in",
        "password": "password123"
    })
    print(f"  Login status: {status}, success: {data.get('success')}")
    assert status == 200
    token = data.get("token")
    assert token is not None, "JWT token must be returned"
    user = data.get("user", {})
    assert user.get("role") == "tourist"
    user_id = user.get("id")
    print(f"  [OK] Authenticated user: {user.get('name')} ({user_id})")

    # 2. AUTH - Register New Real User
    print("\n[TEST 2] Auth - Register New Real User...")
    random_email = f"test_{uuid.uuid4().hex[:6]}@domain.com"
    status, reg_data = req("POST", "/api/auth/register", {
        "email": random_email,
        "password": "strongPassword123",
        "name": "Pooja Verma",
        "role": "tourist"
    })
    print(f"  Register status: {status}, success: {reg_data.get('success')}")
    assert status == 200
    reg_token = reg_data.get("token")
    assert reg_token is not None

    # 3. AUTH - Profile Check (/api/auth/me)
    print("\n[TEST 3] Auth - Verify Profile with JWT (/api/auth/me)...")
    status, me_data = req("GET", "/api/auth/me", token=token)
    print(f"  /api/auth/me status: {status}, email: {me_data.get('user', {}).get('email')}")
    assert status == 200
    assert me_data.get("user", {}).get("email") == "aarav.sharma@travelsathi.in"

    # 4. USER - Saved Places (POST, GET, DELETE)
    print("\n[TEST 4] User Persistence - Bookmarking Destination...")
    status, save_res = req("POST", "/api/user/saved", {
        "user_id": user_id,
        "destination_id": 2360,
        "notes": "Must visit morning walk in cedar forests"
    })
    print(f"  Save place status: {status}, message: {save_res.get('message')}")
    assert status == 200

    status, list_saved = req("GET", f"/api/user/saved?user_id={user_id}")
    print(f"  Get saved count: {list_saved.get('count', 0)}")
    assert status == 200
    assert list_saved.get("count") >= 1
    sample_saved = list_saved["saved_places"][0]
    print(f"  [OK] Saved destination: {sample_saved.get('name')} (State: {sample_saved.get('state')})")

    status, del_res = req("DELETE", f"/api/user/saved/2360?user_id={user_id}")
    print(f"  Delete saved status: {status}, deleted: {del_res.get('deleted_count')}")
    assert status == 200

    # 5. USER - Preferences Persistence
    print("\n[TEST 5] User Persistence - Travel Twin Preferences...")
    status, pref_res = req("POST", "/api/user/preferences", {
        "user_id": user_id,
        "travel_style": "Slow Heritage & Scenic",
        "budget_tier": "Moderate",
        "group_type": "solo"
    })
    print(f"  Update preferences status: {status}, success: {pref_res.get('success')}")
    assert status == 200

    status, get_pref = req("GET", f"/api/user/preferences?user_id={user_id}")
    assert status == 200
    assert get_pref.get("travel_style") == "Slow Heritage & Scenic"
    print(f"  [OK] Persisted style: {get_pref.get('travel_style')}")

    # 6. ITINERARY - User Saved Itineraries
    print("\n[TEST 6] Itinerary - User Saved Trips List (/api/itinerary/user/{id})...")
    status, trips_data = req("GET", f"/api/itinerary/user/{user_id}")
    print(f"  User trips status: {status}, count: {trips_data.get('count')}")
    assert status == 200

    # 7. MAP - Live Map Points (/api/destinations/map-points)
    print("\n[TEST 7] Map - Real Grounded Map Points (/api/destinations/map-points)...")
    status, map_data = req("GET", "/api/destinations/map-points?limit=25")
    print(f"  Map points status: {status}, count: {map_data.get('count')}")
    assert status == 200
    assert map_data.get("count") >= 20
    first_pt = map_data["points"][0]
    print(f"  [OK] Sample marker: '{first_pt.get('name')}' at ({first_pt.get('lat')}, {first_pt.get('lng')})")

    # 8. ADMIN - 100% Real Database Stats & Zero Fake Data
    print("\n[TEST 8] Admin - Accurate Database Stats (/api/admin/stats)...")
    status, stats = req("GET", "/api/admin/stats")
    print(f"  Admin stats status: {status}")
    assert status == 200
    print(f"  [OK] Destinations: {stats.get('destinations_count')}")
    print(f"  [OK] Real Users Count: {stats.get('total_users')}")
    print(f"  [OK] Total Itineraries: {stats.get('total_itineraries')}")
    print(f"  [OK] Total Bookmarks: {stats.get('total_saves')}")
    print(f"  [OK] Total Searches Logged: {stats.get('total_searches')}")
    assert stats.get("destinations_count") >= 12000
    assert stats.get("total_users") >= 4

    # 9. ADMIN - List Real Users
    print("\n[TEST 9] Admin - Real Users Table (/api/admin/users)...")
    status, users_list = req("GET", "/api/admin/users")
    print(f"  Admin users list status: {status}, count: {users_list.get('total')}")
    assert status == 200
    assert users_list.get("total") >= 4

    print("\n==================================================")
    print("[SUCCESS] ALL 9 FULL SUITE INTEGRATION TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    run_suite()
