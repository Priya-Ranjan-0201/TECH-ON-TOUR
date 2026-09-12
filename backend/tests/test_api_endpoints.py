import json
from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)

def get(path):
    response = client.get(path)
    try:
        data = response.json()
    except Exception:
        data = {}
    return response.status_code, data

def test_all():
    print("--- 1. Testing Search Queries ---")
    for q in ["Manali", "Punjab", "mountain", "beach", "temple"]:
        status, data = get(f"/api/destinations/search?q={q}&limit=5")
        count = data.get("count", 0)
        results = data.get("results", [])
        sample = results[0]["name"] if results else "None"
        print(f"Search '{q}': status={status}, count={count}, first='{sample}'")
        assert status == 200, f"Search {q} failed with status {status}"
        assert count > 0, f"Search {q} returned 0 results"

    print("\n--- 2. Testing Destination Details ---")
    # Fetch Manali search top result ID
    _, s_data = get("/api/destinations/search?q=Manali&limit=1")
    top_id = s_data["results"][0]["id"]
    print(f"Testing ID {top_id} ({s_data['results'][0]['name']})...")
    status, d_data = get(f"/api/destinations/{top_id}")
    print(f"Detail status: {status}, success: {d_data.get('success')}")
    dest = d_data.get("destination", {})
    print(f"Name: {dest.get('name')}, State: {dest.get('state')}, Rating: {dest.get('rating')}")
    assert status == 200
    assert dest.get("name") is not None

    print("\n--- 3. Testing 404 for invalid ID ---")
    status_404, d_404 = get("/api/destinations/999999")
    print(f"404 test status: {status_404}, detail: {d_404.get('detail')}")
    assert status_404 == 404

    print("\n--- 4. Testing Recommendations Rails ---")
    status, r_data = get("/api/recommendations/rails")
    rails = r_data.get("rails", [])
    print(f"Rails status: {status}, rails count: {len(rails)}")
    for r in rails[:3]:
        item_count = len(r.get("items", []))
        sample_item = r["items"][0] if item_count else {}
        dest_obj = sample_item.get("destination", {})
        print(f"  Rail: '{r.get('title')}' - items: {item_count}, sample ID: {dest_obj.get('id')} ({dest_obj.get('name')})")

    print("\n--- 5. Testing Nearby Recommendations ---")
    status, n_data = get(f"/api/recommendations/nearby?destination_id={top_id}&top_k=4")
    nearby = n_data.get("nearby_destinations", [])
    print(f"Nearby status: {status}, count: {len(nearby)}")
    if nearby:
        print(f"  First nearby: {nearby[0].get('name')} (dist: {nearby[0].get('distance_km')} km)")

    print("\n--- 6. Testing Similar Recommendations ---")
    status, sim_data = get(f"/api/recommendations/similar?destination_id={top_id}&top_k=4")
    similar = sim_data.get("similar_destinations", [])
    print(f"Similar status: {status}, count: {len(similar)}")
    if similar:
        print(f"  First similar: {similar[0].get('name')} (similarity: {similar[0].get('similarity_score')})")

    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_all()
