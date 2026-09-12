import pytest
import sqlite3
import httpx
from app.services.recommendation_service import season_match, parse_season_range
from app.services.pricing_service import predict_price_for_listing_sync

def test_1_season_match_distinct_per_destination():
    # Test: Manali (Oct-Feb) vs Goa (Nov-Mar) vs Kerala (Jun-Sep)
    # In month 10 (Oct):
    manali_oct = season_match(10, "Oct-Feb")
    goa_oct = season_match(10, "Nov-Mar")
    kerala_oct = season_match(10, "Jun-Sep")
    assert manali_oct == 1, "Manali must match in Oct"
    assert goa_oct == 0, "Goa must not match in Oct"
    assert kerala_oct == 0, "Kerala must not match in Oct"
    # They must return different match values across different months
    assert len({manali_oct, goa_oct, kerala_oct}) == 2  # 1 and 0

    # In month 7 (Jul):
    manali_jul = season_match(7, "Oct-Feb")
    goa_jul = season_match(7, "Nov-Mar")
    kerala_jul = season_match(7, "Jun-Sep")
    assert kerala_jul == 1, "Kerala must match in Jul"
    assert manali_jul == 0
    assert goa_jul == 0


def test_2_price_prediction_distinct_per_listing_id():
    # Call predict_price_for_listing_sync for 3 different real listing_ids
    # Assert 3 different outputs
    id1 = "da488d44-9a2a-4108-8d18-8218b7c73dee"
    id2 = "f1eef217-2638-4aa0-8b8f-4a9be0587088"
    id3 = "65fed476-f1c3-4488-8912-9ffd9e19e965"

    res1 = predict_price_for_listing_sync(id1)
    res2 = predict_price_for_listing_sync(id2)
    res3 = predict_price_for_listing_sync(id3)

    p1 = res1.get("predicted_price_inr") or res1.get("predicted_price") or res1.get("suggested_price")
    p2 = res2.get("predicted_price_inr") or res2.get("predicted_price") or res2.get("suggested_price")
    p3 = res3.get("predicted_price_inr") or res3.get("predicted_price") or res3.get("suggested_price")

    assert p1 > 0 and p2 > 0 and p3 > 0
    distinct_prices = {p1, p2, p3}
    assert len(distinct_prices) == 3, f"Must return 3 distinct price outputs: {p1}, {p2}, {p3}"


def test_3_zero_duplicate_image_urls_across_ids():
    import os
    db_path = "backend/travelsathi_dev.db" if os.path.exists("backend/travelsathi_dev.db") else "travelsathi_dev.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    query = """
    SELECT image_url, count(DISTINCT id) FROM destinations_master
    WHERE image_url IS NOT NULL 
      AND image_url != '' 
      AND image_source != 'placeholder'
    GROUP BY image_url 
    HAVING count(DISTINCT id) > 1;
    """
    cursor.execute(query)
    duplicates = cursor.fetchall()
    conn.close()
    assert len(duplicates) == 0, f"Found {len(duplicates)} duplicate image_urls: {duplicates}"


def test_6_concierge_distinct_answers_logged():
    url = "http://127.0.0.1:8000/api/chat/message"
    # Query 1
    r1 = httpx.post(url, json={"message": "What is the best quiet place in Himachal Pradesh?"}, timeout=10.0)
    assert r1.status_code == 200
    ans1 = r1.json()["response_text"]

    # Query 2
    r2 = httpx.post(url, json={"message": "Suggest coastal seafood and beaches in Goa."}, timeout=10.0)
    assert r2.status_code == 200
    ans2 = r2.json()["response_text"]

    assert ans1 != ans2, "Concierge must return distinct answers for distinct prompts"
    assert "PM-JUGA" not in ans1 and "PM-JUGA" not in ans2, "PM-JUGA copy must be purged from responses"


def test_7_routing_directions_real_route_and_distance():
    url = "http://127.0.0.1:8000/api/routing/directions?start_lat=28.6139&start_lng=77.2090&end_lat=32.2396&end_lng=77.1887"
    r = httpx.get(url, timeout=10.0)
    assert r.status_code == 200
    data = r.json()
    assert data["distance_km"] > 300, f"Real distance expected, got {data['distance_km']}"
    assert data["duration_min"] > 300, f"Real duration expected, got {data['duration_min']}"
    assert len(data["coordinates"]) > 5, "Must return valid polyline coordinates"


def test_8_and_9_hourly_refresh_and_safety_alerts():
    url = "http://127.0.0.1:8000/api/safety/alerts"
    r = httpx.get(url, timeout=10.0)
    assert r.status_code == 200
    data = r.json()
    assert "Today" in data["fetch_time"], f"Must carry real today HH:MM timestamp, got {data['fetch_time']}"
    assert len(data["alerts"]) >= 3, "Must have weather caution cards"
    assert len(data["official_helplines"]) >= 4, "Must preserve static official helplines"
    first_alert = data["alerts"][0]
    assert "fetch_time" in first_alert and "Today" in first_alert["fetch_time"]
