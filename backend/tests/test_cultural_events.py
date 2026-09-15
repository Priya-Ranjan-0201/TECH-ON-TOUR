import pytest
from app.services.event_recommendation_engine import evaluate_event_recommendation

# Mock events database records
DURGA_PUJA = {
    "event_id": "EVT_WB_KOL_001",
    "event_name": "Durga Puja — Kolkata",
    "official_name": "Kolkata Sharodotsav (Durga Puja)",
    "event_type": "Art & Heritage Festival",
    "event_category": "CULTURAL",
    "importance_tier": "TIER 1",
    "heritage_status": "UNESCO Intangible Cultural Heritage",
    "unesco_status": "UNESCO Intangible Cultural Heritage",
    "state": "West Bengal",
    "city": "Kolkata",
    "venue": "Citywide Community Pandals & Rajbaris",
    "latitude": 22.5726,
    "longitude": 88.3639,
    "event_start_date": "2026-10-17",
    "event_end_date": "2026-10-21",
    "typical_month": "October",
    "date_confidence": "HIGH",
    "expected_footfall": "Very High",
    "crowd_level": "Extremely Crowded",
    "tourist_interests": "Art, Architecture, Street Food, Photography, Music, Heritage",
    "hero_image_url": "https://images.unsplash.com/photo-1601614210619-fa0d046f2c20"
}

PUSHKAR_FAIR = {
    "event_id": "EVT_RJ_PUS_001",
    "event_name": "Pushkar Camel Fair",
    "official_name": "Pushkar Mela & Cultural Festival",
    "event_type": "Livestock & Cultural Mela",
    "event_category": "LIVESTOCK / MELAS",
    "importance_tier": "TIER 1",
    "heritage_status": "Nationally Recognized",
    "unesco_status": "Not Listed",
    "state": "Rajasthan",
    "city": "Pushkar",
    "venue": "Pushkar Fairgrounds & Sand Dunes",
    "latitude": 26.4897,
    "longitude": 74.5511,
    "event_start_date": "2026-11-17",
    "event_end_date": "2026-11-24",
    "typical_month": "November",
    "date_confidence": "HIGH",
    "expected_footfall": "Very High",
    "crowd_level": "Heavily Congested",
    "tourist_interests": "Photography, Rural Culture, Folk Music, Camel Trading, Handicrafts",
    "hero_image_url": "https://images.unsplash.com/photo-1598890777032-bde835ba27c2"
}

DECEMBER_HORNBILL = {
    "event_id": "EVT_NL_KOH_001",
    "event_name": "Hornbill Festival",
    "official_name": "Hornbill Festival of Nagaland",
    "event_type": "Indigenous Cultural Festival",
    "event_category": "TRIBAL",
    "importance_tier": "TIER 1",
    "heritage_status": "Nationally Recognized",
    "unesco_status": "Not Listed",
    "state": "Nagaland",
    "city": "Kohima",
    "venue": "Kisama Heritage Village",
    "latitude": 25.6751,
    "longitude": 94.1086,
    "event_start_date": "2026-12-01",
    "event_end_date": "2026-12-10",
    "typical_month": "December",
    "date_confidence": "HIGH",
    "expected_footfall": "High",
    "crowd_level": "Crowded",
    "tourist_interests": "Tribal Heritage, Indigenous Music, Traditional Food, Crafts",
    "hero_image_url": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220"
}

FOOD_FESTIVAL = {
    "event_id": "EVT_DL_DEL_002",
    "event_name": "National Street Food Festival",
    "official_name": "National Street Food Festival New Delhi",
    "event_type": "Culinary Festival",
    "event_category": "FOOD",
    "importance_tier": "TIER 2",
    "heritage_status": "Nationally Recognized",
    "unesco_status": "Not Listed",
    "state": "Delhi",
    "city": "New Delhi",
    "venue": "Jawaharlal Nehru Stadium",
    "latitude": 28.5828,
    "longitude": 77.2344,
    "event_start_date": "2026-11-20",
    "event_end_date": "2026-11-23",
    "typical_month": "November",
    "date_confidence": "HIGH",
    "expected_footfall": "High",
    "crowd_level": "Crowded",
    "tourist_interests": "Street Food, Regional Cuisine, Culinary Heritage",
    "hero_image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5"
}

def test_scenario_1_kolkata_dates_approaching():
    """User in Kolkata Oct 1-7. Durga Puja is Oct 17-21 (10 days after). Should recommend shifting dates."""
    rec = evaluate_event_recommendation(
        user_destination="Kolkata",
        user_lat=22.5726,
        user_lng=88.3639,
        trip_start_date="2026-10-01",
        trip_end_date="2026-10-07",
        event=DURGA_PUJA
    )
    assert rec is not None
    assert rec["match_type"] == "COMING_SOON_AFTER"
    assert rec["can_adjust_dates"] is True
    assert "10 days" in rec["recommendation_reason"]
    assert rec["suggested_dates"]["start_date"] == "2026-10-17"

def test_scenario_2_kolkata_perfect_overlap():
    """User in Kolkata Oct 17-21. Durga Puja is Oct 17-21. Should be a Perfect Match."""
    rec = evaluate_event_recommendation(
        user_destination="Kolkata",
        user_lat=22.5726,
        user_lng=88.3639,
        trip_start_date="2026-10-17",
        trip_end_date="2026-10-21",
        event=DURGA_PUJA
    )
    assert rec is not None
    assert rec["match_type"] == "PERFECT_MATCH"
    assert rec["relevance_score"] >= 5.0
    assert "Happening during your entire planned stay" in rec["recommendation_reason"]

def test_scenario_3_kolkata_past_event_not_recommended():
    """User in Kolkata Nov 10-15. Durga Puja ended Oct 21. Must NEVER be recommended as upcoming."""
    rec = evaluate_event_recommendation(
        user_destination="Kolkata",
        user_lat=22.5726,
        user_lng=88.3639,
        trip_start_date="2026-11-10",
        trip_end_date="2026-11-15",
        event=DURGA_PUJA
    )
    assert rec is None, "Ended events must not be recommended for future trips"

def test_scenario_4_jaipur_pushkar_proximity():
    """User in Jaipur Nov 15-25. Pushkar Fair is Nov 17-24 (~140 km). Should recommend as nearby event."""
    rec = evaluate_event_recommendation(
        user_destination="Jaipur",
        user_lat=26.9124,
        user_lng=75.7873,
        trip_start_date="2026-11-15",
        trip_end_date="2026-11-25",
        event=PUSHKAR_FAIR
    )
    assert rec is not None
    assert 100 <= rec["distance_km"] <= 160
    assert rec["match_type"] in ["PERFECT_MATCH", "HAPPENING_DURING_TRIP"]
    assert rec["relevance_score"] >= 4.0

def test_scenario_5_mumbai_july_distant_december():
    """User in Mumbai in July. December festival should NOT be recommended for current trip."""
    rec = evaluate_event_recommendation(
        user_destination="Mumbai",
        user_lat=19.0760,
        user_lng=72.8777,
        trip_start_date="2026-07-10",
        trip_end_date="2026-07-20",
        event=DECEMBER_HORNBILL
    )
    assert rec is None, "Events >90 days away and far away should not clutter trip recommendations"

def test_scenario_6_user_interest_ranking():
    """User with 'Food' interest should score Food festival higher than generic."""
    rec_generic = evaluate_event_recommendation(
        user_destination="New Delhi",
        user_lat=28.6139,
        user_lng=77.2090,
        trip_start_date="2026-11-19",
        trip_end_date="2026-11-25",
        event=FOOD_FESTIVAL,
        user_interests=None
    )
    rec_food_lover = evaluate_event_recommendation(
        user_destination="New Delhi",
        user_lat=28.6139,
        user_lng=77.2090,
        trip_start_date="2026-11-19",
        trip_end_date="2026-11-25",
        event=FOOD_FESTIVAL,
        user_interests=["Food", "Culinary"]
    )
    assert rec_food_lover["relevance_score"] > rec_generic["relevance_score"]

def test_scenario_7_patna_november_chhath_puja():
    """User in Patna Nov 1-7. Chhath Puja (Nov 13-16) must be recommended with date shift; Visakhapatnam must be excluded."""
    chhath_event = {
        "event_id": "EVT-0017",
        "event_name": "Chhath Puja",
        "official_name": "Chhath Mahaparv",
        "event_type": "Sacred Ceremony",
        "event_category": "RELIGIOUS / SPIRITUAL",
        "importance_tier": "TIER 1",
        "state": "Bihar",
        "city": "Patna / Bodh Gaya / Muzaffarpur",
        "latitude": 25.5941,
        "longitude": 85.1376,
        "event_start_date": "2026-11-13",
        "event_end_date": "2026-11-16",
        "typical_month": "November",
        "date_confidence": "HIGH",
        "expected_footfall": "Very High",
        "crowd_level": "Extremely Crowded",
        "tourist_interests": "Sun Worship, Ganga Ghats, Sacred Rituals, Folk Songs",
        "hero_image_url": "https://images.unsplash.com/photo-1605379399642-870262d3d051"
    }
    visakha_event = {
        "event_id": "EVT-0088",
        "event_name": "Visakha Utsav",
        "official_name": "Visakhapatnam Beach & Culture Festival",
        "event_type": "Tourism Festival",
        "event_category": "TOURISM",
        "importance_tier": "TIER 2",
        "state": "Andhra Pradesh",
        "city": "Visakhapatnam",
        "latitude": 17.7166,
        "longitude": 83.3333,
        "event_start_date": "2026-12-15",
        "event_end_date": "2026-12-18",
        "typical_month": "December",
        "date_confidence": "HIGH",
        "expected_footfall": "Moderate",
        "crowd_level": "Comfortable",
        "tourist_interests": "Beach, Seafood, Music",
        "hero_image_url": "https://images.unsplash.com/photo-1598890777032-bde835ba27c2"
    }

    # Patna coordinates
    patna_lat, patna_lng = 25.5941, 85.1376

    rec_chhath = evaluate_event_recommendation(
        user_destination="Patna",
        user_lat=patna_lat,
        user_lng=patna_lng,
        trip_start_date="2026-11-01",
        trip_end_date="2026-11-07",
        event=chhath_event
    )
    assert rec_chhath is not None
    assert rec_chhath["match_type"] == "COMING_SOON_AFTER"
    assert rec_chhath["can_adjust_dates"] is True
    assert rec_chhath["suggested_dates"]["start_date"] == "2026-11-13"
    assert rec_chhath["distance_km"] < 10.0

    # Visakhapatnam event must be strictly rejected (>250km and distant December)
    rec_visakha = evaluate_event_recommendation(
        user_destination="Patna",
        user_lat=patna_lat,
        user_lng=patna_lng,
        trip_start_date="2026-11-01",
        trip_end_date="2026-11-07",
        event=visakha_event
    )
    assert rec_visakha is None, "Visakhapatnam is 900+ km away from Patna and must NEVER be recommended"

