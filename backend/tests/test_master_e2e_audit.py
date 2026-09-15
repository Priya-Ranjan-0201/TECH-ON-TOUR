import sys
import os
import uuid

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from starlette.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

def run_tests():
    print("==================================================")
    print("STARTING FULL-SYSTEM MASTER AUDIT & E2E VALIDATION")
    print("==================================================")
    
    client = TestClient(app)

    # 1. Health check & Docs
    print("\n[1/16] System Health & OpenAPI Docs")
    r = client.get("/docs")
    assert r.status_code == 200, f"Docs endpoint failed: {r.status_code}"
    print("  [PASS] FastAPI OpenAPI docs available at /docs")

    # 2. Registration & Authentication
    print("\n[2/16] User Registration Flow")
    unique_email = f"audit_user_{uuid.uuid4().hex[:6]}@travelsathi.in"
    reg_payload = {
        "email": unique_email,
        "password": "Password123!",
        "full_name": "Audit Test Traveler",
        "role": "tourist"
    }
    r = client.post("/api/auth/register", json=reg_payload)
    assert r.status_code == 200, f"Registration failed ({r.status_code}): {r.text}"
    res = r.json()
    user_data = res.get("user", {})
    token = res.get("token") or res.get("access_token")
    user_id = user_data.get("id")
    assert user_id, f"User ID missing from registration response: {res}"
    assert token, f"JWT token missing from registration response: {res}"
    print(f"  [PASS] Registered new user: {unique_email} (ID: {user_id})")

    # 3. Login Flow
    print("\n[3/16] User Login Flow")
    login_payload = {
        "email": unique_email,
        "password": "Password123!"
    }
    r = client.post("/api/auth/login", json=login_payload)
    assert r.status_code == 200, f"Login failed ({r.status_code}): {r.text}"
    token = r.json().get("token") or r.json().get("access_token")
    assert token, "Login did not return access token"
    print("  [PASS] Login successful, JWT token received")

    # 4. Auth Me / Profile
    print("\n[4/16] Authenticated Profile /me")
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200, f"/me failed ({r.status_code}): {r.text}"
    me_data = r.json().get("user", {})
    assert me_data.get("email") == unique_email, "Email mismatch in /me"
    print(f"  [PASS] Validated /me profile identity: {me_data.get('name') or me_data.get('full_name')}")

    # 5. User Travel Twin Preferences Persistence
    print("\n[5/16] User Travel Twin Preferences Persistence")
    pref_payload = {
        "user_id": user_id,
        "travel_style": "Nature & Slow Travel",
        "budget_tier": "Moderate (INR 2,500 - 4,000/day)",
        "preferred_stay": "Verified Eco-Homestays",
        "food_preference": "Vegetarian Friendly",
        "pace": "Unrushed / Mindful",
        "accessibility_requirements": "Ground floor rooms"
    }
    r = client.post("/api/user/preferences", json=pref_payload)
    assert r.status_code == 200, f"Preferences save failed ({r.status_code}): {r.text}"
    
    r = client.get(f"/api/user/preferences?user_id={user_id}")
    assert r.status_code == 200, f"Preferences get failed ({r.status_code}): {r.text}"
    res = r.json()
    saved_prefs = res.get("preferences") or res
    assert saved_prefs.get("travel_style") == "Nature & Slow Travel", f"Mismatch in travel_style: {saved_prefs}"
    print("  [PASS] Preferences persisted and recovered from database")

    # 6. Search System
    print("\n[6/16] Destination Search Engine")
    for q in ["Manali", "Delhi", "Kerala", "temple", "beach"]:
        r = client.get(f"/api/destinations/search?q={q}&limit=5")
        assert r.status_code == 200, f"Search '{q}' failed ({r.status_code}): {r.text}"
        res = r.json()
        assert "results" in res, f"Search '{q}' results missing"
        assert len(res["results"]) > 0, f"Search '{q}' returned 0 results"
        item = res["results"][0]
        assert "id" in item and "name" in item and "category" in item
        print(f"  [PASS] Search '{q}': found {len(res['results'])} items (Top: {item['name']}, {item.get('state')})")

    # 7. Destination Details
    print("\n[7/16] Destination Profile by ID")
    r = client.get("/api/destinations/2360")
    assert r.status_code == 200, f"Destination 2360 get failed ({r.status_code}): {r.text}"
    dest_res = r.json()
    dest = dest_res.get("destination") or dest_res
    dest_id = dest.get("id") or dest.get("destination_id")
    assert dest_id, f"Destination ID missing: {dest_res}"
    assert "name" in dest and "state" in dest
    print(f"  [PASS] Retrieved destination {dest_id}: {dest.get('name')}, {dest.get('state')} (Rating: {dest.get('rating')})")

    # 8. GIS Map Points
    print("\n[8/16] GIS Map Points & Bounds Validation")
    r = client.get("/api/destinations/map-points?limit=50")
    assert r.status_code == 200, f"Map points failed ({r.status_code}): {r.text}"
    points = r.json().get("points", [])
    assert len(points) > 0, "Zero map points returned"
    for p in points[:10]:
        lat = p.get("lat") or p.get("latitude")
        lng = p.get("lng") or p.get("longitude")
        assert lat is not None and lng is not None, "Missing coordinates"
        # Validate India bounding coordinates (Lat: 6 to 38, Lng: 68 to 98)
        assert 6.0 <= lat <= 38.5, f"Latitude {lat} outside India bounds"
        assert 68.0 <= lng <= 98.5, f"Longitude {lng} outside India bounds"
    print(f"  [PASS] Verified {len(points)} map points with valid coordinates within India geographical bounds")

    # 9. Saved Places (Bookmarks)
    print("\n[9/16] Saved Places (Bookmark, List, Delete)")
    r = client.post("/api/user/saved", json={"user_id": user_id, "destination_id": 2360})
    assert r.status_code == 200, f"Save failed ({r.status_code}): {r.text}"
    
    r = client.get(f"/api/user/saved?user_id={user_id}")
    assert r.status_code == 200, f"Get saved failed ({r.status_code}): {r.text}"
    saved_list = r.json().get("saved_places", [])
    assert len(saved_list) > 0, "Saved list is empty"
    print(f"  [PASS] Saved place 2360 successfully, recovered {len(saved_list)} items")
    
    r = client.delete(f"/api/user/saved/2360?user_id={user_id}")
    assert r.status_code == 200, f"Delete saved failed ({r.status_code}): {r.text}"
    print("  [PASS] Unsaved place 2360 successfully")

    # 10. Travel History & Telemetry
    print("\n[10/16] User Interaction & Search History Telemetry")
    r = client.get(f"/api/user/history?user_id={user_id}")
    assert r.status_code == 200, f"Get history failed ({r.status_code}): {r.text}"
    history_items = r.json().get("history", [])
    print(f"  [PASS] History retrieved: {len(history_items)} interactions recorded for user")

    # 11. Itinerary Generator & User Trips
    print("\n[11/16] AI / Graph Itinerary Generation & Trip Management")
    itin_req = {
        "destination": "Himachal Pradesh",
        "days": 3,
        "interests": ["Nature", "Heritage"],
        "pace": "moderate",
        "budget": "moderate",
        "travel_twin_profile": {"userId": user_id}
    }
    r = client.post("/api/itinerary/generate", json=itin_req)
    assert r.status_code == 201, f"Itinerary generation failed ({r.status_code}): {r.text}"
    itin_data = r.json()
    itin_id = itin_data.get("id")
    assert itin_id, "Itinerary ID missing"
    print(f"  [PASS] Generated itinerary {itin_id} for {itin_data.get('destination')} ({itin_data.get('days')} days)")
    
    # Check user trips
    r = client.get(f"/api/itinerary/user/{user_id}")
    assert r.status_code == 200, f"Get user trips failed ({r.status_code}): {r.text}"
    user_trips = r.json().get("trips", [])
    print(f"  [PASS] Retrieved {len(user_trips)} user trips from database")
    
    # Delete itinerary
    r = client.delete(f"/api/itinerary/{itin_id}")
    assert r.status_code == 200, f"Delete itinerary failed ({r.status_code}): {r.text}"
    print(f"  [PASS] Deleted itinerary {itin_id} successfully")

    # 12. Recommendation Systems
    print("\n[12/16] Multi-Model AI Recommendation Endpoints")
    r = client.get("/api/recommendations?top_k=5")
    assert r.status_code == 200, f"Recommendations failed ({r.status_code}): {r.text}"
    recs = r.json().get("recommendations", [])
    assert len(recs) > 0, "No recommendations returned"
    print(f"  [PASS] Multi-model recommendation engine returned {len(recs)} ranked candidates (Top: {recs[0].get('name')})")

    r_nearby = client.get("/api/recommendations/nearby?lat=32.2396&lon=77.1887&radius_km=50")
    assert r_nearby.status_code == 200, f"Nearby recommendations failed: {r_nearby.text}"
    print(f"  [PASS] Geo-spatial nearby recommendations validated for Himachal region")

    # 13. Admin Real Stats
    print("\n[13/16] Admin Dashboard Telemetry (Zero Fabricated Metrics)")
    client.cookies.clear()
    admin_token = create_access_token({"sub": "admin-001", "role": "admin", "email": "admin.ops@travelsathi.gov.in"})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    r = client.get("/api/admin/stats", headers=admin_headers)
    assert r.status_code == 200, f"Admin stats failed ({r.status_code}): {r.text}"
    stats = r.json()
    assert "total_users" in stats
    assert "destinations_count" in stats
    assert "total_itineraries" in stats
    assert "total_saves" in stats
    assert "total_searches" in stats
    assert stats["destinations_count"] >= 12000, "Destinations count less than 12000"
    print(f"  [PASS] Live SQL Stats: {stats['total_users']} Users, {stats['destinations_count']} POIs, {stats['total_itineraries']} Itineraries, {stats['total_saves']} Saves, {stats['total_searches']} Searches")

    # 14. Admin User Management
    print("\n[14/16] Admin User Management & Role RBAC")
    r = client.get("/api/admin/users", headers=admin_headers)
    assert r.status_code == 200, f"Admin users failed ({r.status_code}): {r.text}"
    users = r.json().get("users", [])
    assert len(users) >= 4, "Fewer than 4 seeded users found"
    print(f"  [PASS] Admin user directory lists {len(users)} registered accounts")
    
    # Change test user role to 'host'
    r = client.put(f"/api/admin/users/{user_id}/role", json={"role": "host"}, headers=admin_headers)
    assert r.status_code == 200, f"Role change failed ({r.status_code}): {r.text}"
    
    # Verify change
    r = client.get("/api/admin/users", headers=admin_headers)
    updated_user = next((u for u in r.json().get("users", []) if u["id"] == user_id), None)
    assert updated_user and updated_user["role"] == "host", "Role was not updated in database"
    print(f"  [PASS] Promoted user {user_id} to 'host' role and verified in database")

    # 15. Admin Destination Management
    print("\n[15/16] Admin Destination Editing & DB Update")
    update_payload = {
        "name": "Manali Valley Alpine Hub",
        "category": "Adventure & Nature",
        "rating": 4.9,
        "description": "Premier high-altitude Himalayan mountain resort and alpine trail center in Himachal Pradesh."
    }
    r = client.put("/api/admin/destinations/2360", json=update_payload, headers=admin_headers)
    assert r.status_code == 200, f"Admin destination update failed ({r.status_code}): {r.text}"
    
    # Verify by getting destination
    r = client.get("/api/destinations/2360")
    res_dest = r.json()
    updated_dest = res_dest.get("destination") or res_dest
    assert updated_dest.get("name") == "Manali Valley Alpine Hub", "Destination name not updated in database"
    assert updated_dest.get("rating") == 4.9, "Destination rating not updated in database"
    print(f"  [PASS] Destination 2360 updated in SQLite database: '{updated_dest.get('name')}' (Rating: {updated_dest.get('rating')})")

    # 16. Security Checks
    print("\n[16/16] Security & Authentication Guard")
    r = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid_token_123"})
    assert r.status_code == 401, f"Expected 401 for invalid token, got {r.status_code}"
    print("  [PASS] Unauthorized access rejected with HTTP 401")

    print("\n==================================================")
    print("ALL 16 MASTER AUDIT TESTS PASSED WITH 0 FAILURES!")
    print("==================================================")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)
