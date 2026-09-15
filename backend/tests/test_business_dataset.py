import os
import csv
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "business"))

BUSINESSES_CSV = os.path.join(DATA_DIR, "TRAVELSATHI_TOURISM_BUSINESSES_INDIA.csv")
DESTINATIONS_CSV = os.path.join(DATA_DIR, "TRAVELSATHI_TOURIST_PLACES_INDIA.csv")
MAPPING_CSV = os.path.join(DATA_DIR, "TRAVELSATHI_DESTINATION_BUSINESS_MAPPING.csv")
DICTIONARY_CSV = os.path.join(DATA_DIR, "TRAVELSATHI_DATA_DICTIONARY.csv")


def test_master_csv_files_exist_and_non_empty():
    """Ensure all 4 master CSV dataset files exist and contain records."""
    assert os.path.exists(BUSINESSES_CSV), f"Missing {BUSINESSES_CSV}"
    assert os.path.exists(DESTINATIONS_CSV), f"Missing {DESTINATIONS_CSV}"
    assert os.path.exists(MAPPING_CSV), f"Missing {MAPPING_CSV}"
    assert os.path.exists(DICTIONARY_CSV), f"Missing {DICTIONARY_CSV}"

    for path in [BUSINESSES_CSV, DESTINATIONS_CSV, MAPPING_CSV, DICTIONARY_CSV]:
        size = os.path.getsize(path)
        assert size > 1000, f"File {path} is smaller than expected ({size} bytes)"


def test_businesses_dataset_schema_and_constraints():
    """Verify businesses CSV has 76 columns, valid coordinates, and unique IDs."""
    business_ids = set()
    total_rows = 0

    with open(BUSINESSES_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        assert len(fieldnames) == 76, f"Expected 76 columns, found {len(fieldnames)}"

        # Verify key columns exist
        expected_cols = [
            "business_id", "business_name", "business_type", "business_category",
            "state", "latitude", "longitude", "tourist_place_id",
            "distance_from_tourist_place_km", "rating", "review_count"
        ]
        for col in expected_cols:
            assert col in fieldnames, f"Column {col} missing from businesses CSV"

        for row in reader:
            total_rows += 1
            bid = row["business_id"]
            assert bid not in business_ids, f"Duplicate business_id found: {bid}"
            business_ids.add(bid)

            # Coordinates validation
            lat = float(row["latitude"])
            lng = float(row["longitude"])
            assert 6.0 <= lat <= 38.0, f"Latitude out of India range: {lat} for {bid}"
            assert 68.0 <= lng <= 98.0, f"Longitude out of India range: {lng} for {bid}"

            # Rating validation
            rating = float(row["rating"])
            assert 1.0 <= rating <= 5.0, f"Invalid rating {rating} for {bid}"

    assert total_rows >= 5000, f"Expected at least 5000 businesses, got {total_rows}"


def test_destinations_dataset_and_mapping():
    """Verify tourist destinations and business proximity mappings."""
    dest_ids = set()
    with open(DESTINATIONS_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            dest_ids.add(row["tourist_place_id"])

    assert len(dest_ids) >= 1000, f"Expected at least 1000 destinations, found {len(dest_ids)}"

    mapping_count = 0
    with open(MAPPING_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            mapping_count += 1
            dist = float(row["distance_km"])
            assert dist >= 0.0, f"Negative distance {dist}"
            assert row["tourist_place_id"] in dest_ids, f"Orphan mapping tourist_place_id: {row['tourist_place_id']}"

    assert mapping_count >= 5000, f"Expected at least 5000 mappings, found {mapping_count}"


def test_api_nearby_businesses():
    """Test GET /api/businesses/nearby returns valid businesses and hourly token."""
    response = client.get("/api/businesses/nearby?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert "businesses" in data
    assert len(data["businesses"]) > 0
    assert "hourly_token" in data
    assert data["hourly_token"].startswith("tok_hourly_")


def test_api_destination_ecosystem():
    """Test GET /api/businesses/destinations/{id}/ecosystem returns stays and food."""
    response = client.get("/api/businesses/destinations/1/ecosystem")
    assert response.status_code == 200
    data = response.json()
    assert "destination_id" in data
    assert "stay_nearby" in data
    assert "eat_nearby" in data
    assert "counts" in data
    assert data["hourly_token"].startswith("tok_hourly_")
    assert data["counts"]["total"] > 0
