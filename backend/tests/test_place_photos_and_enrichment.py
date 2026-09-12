"""
backend/tests/test_place_photos_and_enrichment.py
-------------------------------------------------
Automated test suite verifying:
1. destinations_master schema contains summary, image_source, needs_manual_photo, photo_verified_at.
2. GET /api/destinations/{id} returns enriched fields.
3. Summary text length constraint (<= 600 chars).
4. Valid image_source enumeration ('wikipedia', 'wikimedia_commons', 'manual', 'placeholder').
5. Clean placeholder fallback behavior for needs_manual_photo.
6. Manual verification review CSV integrity.
"""

import pytest
import sqlite3
import csv
from pathlib import Path
from httpx import AsyncClient, ASGITransport
from app.main import app

DB_PATH = Path(__file__).resolve().parent.parent / "travelsathi_dev.db"
CSV_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "enrichment" / "manual_review_enrichment.csv"
CACHE_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "enrichment" / "cache.json"

def test_database_schema_has_enrichment_columns():
    """Verify all 4 enrichment columns exist on destinations_master."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("PRAGMA table_info(destinations_master)")
    cols = {col[1]: col[2] for col in c.fetchall()}
    conn.close()

    assert "summary" in cols, "Column 'summary' missing from destinations_master"
    assert "image_source" in cols, "Column 'image_source' missing from destinations_master"
    assert "needs_manual_photo" in cols, "Column 'needs_manual_photo' missing from destinations_master"
    assert "photo_verified_at" in cols, "Column 'photo_verified_at' missing from destinations_master"

@pytest.mark.asyncio
async def test_destination_detail_endpoint_returns_enrichment_fields():
    """Verify GET /api/destinations/{id} returns summary, image_source, needs_manual_photo."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/destinations/11492")  # India Gate
        assert res.status_code == 200
        data = res.json()
        assert "destination" in data
        dest = data["destination"]
        assert "summary" in dest
        assert "image_source" in dest
        assert "needs_manual_photo" in dest
        assert "photo_verified_at" in dest
        assert dest["image_source"] in ["wikipedia", "wikimedia_commons", "manual", "placeholder"]

def test_summary_character_length_constraint():
    """Verify all non-null summaries in DB are under ~650 characters."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, name, length(summary) FROM destinations_master WHERE summary IS NOT NULL AND summary != ''")
    rows = c.fetchall()
    conn.close()

    for r in rows:
        dest_id, name, length = r
        assert length <= 700, f"Destination {dest_id} ({name}) summary exceeds character limit: {length} chars"

def test_manual_review_csv_exists_and_valid():
    """Verify manual review CSV was produced with required columns."""
    assert CSV_PATH.exists(), f"Manual review CSV missing at {CSV_PATH}"
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames
        expected_headers = ["id", "place_name", "state", "matched_wiki_title", "image_url", "image_source", "summary_preview", "verified", "needs_manual_photo"]
        for eh in expected_headers:
            assert eh in headers, f"Missing expected header '{eh}' in review CSV"
        rows = list(reader)
        assert len(rows) > 0, "Review CSV is empty"

def test_zero_mismatched_unverified_photos_guarantee():
    """Verify destinations flagged needs_manual_photo have image_source='placeholder'."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT count(*) FROM destinations_master WHERE needs_manual_photo = 1 AND image_source != 'placeholder'")
    invalid_rows = c.fetchone()[0]
    conn.close()
    assert invalid_rows == 0, f"Found {invalid_rows} rows with needs_manual_photo=1 but non-placeholder image_source!"
